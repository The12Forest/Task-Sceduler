const TodoList = require('../models/TodoList');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');
const { AppError } = require('../middlewares/errorHandler');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/lists
 * Get all lists for the authenticated user
 */
exports.getLists = asyncHandler(async (req, res) => {
  let lists = await TodoList.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 });

  // Auto-create default list for users that registered before this feature
  if (lists.length === 0) {
    const defaultList = await TodoList.create({
      userId: req.user.id,
      name: 'My Tasks',
      isDefault: true,
    });
    lists = [defaultList];
  }

  // Attach task counts to each list
  const listIds = lists.map((l) => l._id);
  const counts = await Task.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user.id), listId: { $in: listIds } } },
    {
      $group: {
        _id: '$listId',
        total: { $sum: 1 },
        completed: { $sum: { $cond: ['$completed', 1, 0] } },
      },
    },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    countMap[c._id.toString()] = { total: c.total, completed: c.completed };
  });

  const listsWithCounts = lists.map((list) => {
    const c = countMap[list._id.toString()] || { total: 0, completed: 0 };
    return {
      ...list.toObject(),
      taskCount: c.total,
      completedCount: c.completed,
    };
  });

  res.json({ lists: listsWithCounts });
});

/**
 * POST /api/lists
 * Create a new list
 */
exports.createList = asyncHandler(async (req, res) => {
  // Enforce maxListsPerUser from SystemConfig
  const cfg = await SystemConfig.getConfig();
  const listCount = await TodoList.countDocuments({ userId: req.user.id });
  if (listCount >= (cfg.maxListsPerUser || 50)) {
    throw new AppError(`List limit reached (max ${cfg.maxListsPerUser || 50}). Delete some lists first.`, 400);
  }

  const list = await TodoList.create({
    userId: req.user.id,
    name: req.body.name,
  });
  res.status(201).json({ list: { ...list.toObject(), taskCount: 0, completedCount: 0 } });
});

/**
 * PUT /api/lists/:id
 * Update list name
 */
exports.updateList = asyncHandler(async (req, res) => {
  const list = await TodoList.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { name: req.body.name },
    { new: true, runValidators: true }
  );

  if (!list) throw new AppError('List not found', 404);

  res.json({ list });
});

/**
 * DELETE /api/lists/:id
 * Delete a list and all its tasks (cannot delete the default list)
 */
exports.deleteList = asyncHandler(async (req, res) => {
  const list = await TodoList.findOne({ _id: req.params.id, userId: req.user.id });

  if (!list) throw new AppError('List not found', 404);
  if (list.isDefault) throw new AppError('Cannot delete the default list', 400);

  // Delete all tasks in this list
  await Task.deleteMany({ listId: list._id, userId: req.user.id });

  // Delete the list
  await TodoList.deleteOne({ _id: list._id });

  res.json({ message: 'List and its tasks deleted' });
});
