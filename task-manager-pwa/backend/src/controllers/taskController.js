const Task = require('../models/Task');
const TodoList = require('../models/TodoList');
const SystemConfig = require('../models/SystemConfig');
const { AppError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/tasks?listId=...&completed=...&tag=...
 * Get tasks for the authenticated user.
 * Client handles sorting; server just filters.
 */
const getTasks = asyncHandler(async (req, res) => {
  const filter = { userId: req.user.id };

  if (req.query.listId) {
    filter.listId = req.query.listId;
  }

  if (req.query.completed !== undefined) {
    filter.completed = req.query.completed === 'true';
  }

  // Filter by tag
  if (req.query.tag) {
    filter.tags = { $in: [req.query.tag] };
  }

  const tasks = await Task.find(filter).lean();
  res.json({ success: true, count: tasks.length, tasks });
});

/**
 * GET /api/tasks/:id
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, task });
});

/**
 * POST /api/tasks
 * Create a new task (requires listId)
 */
const createTask = asyncHandler(async (req, res) => {
  const { name, description, priority, dueDate, listId, tags, subtasks, selfDestruct } = req.body;

  // Verify the list belongs to the user
  const list = await TodoList.findOne({ _id: listId, userId: req.user.id });
  if (!list) throw new AppError('List not found', 404);

  // Enforce maxTasksPerUser from SystemConfig
  const cfg = await SystemConfig.getConfig();
  const taskCount = await Task.countDocuments({ userId: req.user.id });
  if (taskCount >= (cfg.maxTasksPerUser || 1000)) {
    throw new AppError(`Task limit reached (max ${cfg.maxTasksPerUser || 1000}). Delete some tasks first.`, 400);
  }

  // Check file upload permission
  if (req.file && !cfg.allowFileUploads) {
    throw new AppError('File uploads are disabled by the administrator', 400);
  }

  const taskData = {
    userId: req.user.id,
    listId,
    name,
    description: description || '',
    priority: priority || cfg.defaultPriority || 'Medium',
    dueDate: dueDate || null,
    tags: Array.isArray(tags) ? tags.map((t) => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean) : [],
    subtasks: Array.isArray(subtasks) ? subtasks.map((s) => ({ name: s.name || s, completed: false })) : [],
    selfDestruct: selfDestruct || false,
  };

  if (req.file) {
    taskData.fileUrl = `/uploads/${req.file.filename}`;
  }

  const task = await Task.create(taskData);
  res.status(201).json({ success: true, task });
});

/**
 * PUT /api/tasks/:id
 */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) throw new AppError('Task not found', 404);

  // Validate new listId if provided
  if (req.body.listId) {
    const list = await TodoList.findOne({ _id: req.body.listId, userId: req.user.id });
    if (!list) throw new AppError('List not found', 404);
  }

  const allowedFields = ['name', 'description', 'priority', 'dueDate', 'completed', 'listId', 'reminderSent', 'tags', 'subtasks', 'selfDestruct'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'tags' && Array.isArray(req.body[field])) {
        task[field] = req.body[field].map((t) => t.replace(/^#/, '').trim().toLowerCase()).filter(Boolean);
      } else {
        task[field] = req.body[field];
      }
    }
  });

  // Track completion time and self-destruct scheduling
  if (req.body.completed === true && !task.completedAt) {
    task.completedAt = new Date();
    // If self-destruct is enabled, schedule deletion in 60 seconds
    if (task.selfDestruct) {
      task.selfDestructAt = new Date(Date.now() + 60 * 1000);
    }
  } else if (req.body.completed === false) {
    task.completedAt = null;
    task.selfDestructAt = null;
  }

  if (req.file) {
    task.fileUrl = `/uploads/${req.file.filename}`;
  }

  await task.save();
  res.json({ success: true, task });
});

/**
 * DELETE /api/tasks/:id
 */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, message: 'Task deleted' });
});

/**
 * POST /api/tasks/sync
 * Batch sync offline tasks. Each task must include a valid listId.
 */
const syncTasks = asyncHandler(async (req, res) => {
  const { tasks } = req.body;
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new AppError('No tasks to sync', 400);
  }

  // Verify all provided listIds belong to the user
  const listIds = [...new Set(tasks.map((t) => t.listId).filter(Boolean))];
  const validLists = await TodoList.find({ _id: { $in: listIds }, userId: req.user.id }).lean();
  const validListIdSet = new Set(validLists.map((l) => l._id.toString()));

  const docs = tasks
    .filter((t) => t.listId && validListIdSet.has(t.listId))
    .map(({ name, description, priority, dueDate, completed, listId }) => ({
      userId: req.user.id,
      listId,
      name,
      description: description || '',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      completed: completed || false,
    }));

  if (docs.length === 0) throw new AppError('No valid tasks to sync (invalid or missing listId)', 400);

  const inserted = await Task.insertMany(docs);
  res.status(201).json({ success: true, count: inserted.length, tasks: inserted });
});

/**
 * GET /api/tasks/tags
 * Get all unique tags for the authenticated user
 */
const getUserTags = asyncHandler(async (req, res) => {
  const tags = await Task.distinct('tags', { userId: req.user.id });
  res.json({ success: true, tags: tags.sort() });
});

/**
 * PUT /api/tasks/:id/subtasks/:subtaskId/toggle
 * Toggle a subtask's completed state
 */
const toggleSubtask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
  if (!task) throw new AppError('Task not found', 404);

  const subtask = task.subtasks.id(req.params.subtaskId);
  if (!subtask) throw new AppError('Subtask not found', 404);

  subtask.completed = !subtask.completed;
  await task.save();

  res.json({ success: true, task });
});

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  syncTasks,
  getUserTags,
  toggleSubtask,
};
