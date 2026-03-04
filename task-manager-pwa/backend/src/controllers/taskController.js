const Task = require('../models/Task');
const TodoList = require('../models/TodoList');
const { AppError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/tasks?listId=...&completed=...
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
  const { name, description, priority, dueDate, listId } = req.body;

  // Verify the list belongs to the user
  const list = await TodoList.findOne({ _id: listId, userId: req.user.id });
  if (!list) throw new AppError('List not found', 404);

  const taskData = {
    userId: req.user.id,
    listId,
    name,
    description: description || '',
    priority: priority || 'Medium',
    dueDate: dueDate || null,
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

  const allowedFields = ['name', 'description', 'priority', 'dueDate', 'completed', 'listId', 'reminderSent'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });

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

module.exports = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  syncTasks,
};
