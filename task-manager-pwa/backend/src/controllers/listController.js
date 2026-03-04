const TodoList = require('../models/TodoList');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const { AppError } = require('../middlewares/errorHandler');

/**
 * GET /api/lists
 * Get all lists for the authenticated user
 */
exports.getLists = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/lists
 * Create a new list
 */
exports.createList = async (req, res, next) => {
  try {
    const list = await TodoList.create({
      userId: req.user.id,
      name: req.body.name,
    });
    res.status(201).json({ list: { ...list.toObject(), taskCount: 0, completedCount: 0 } });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/lists/:id
 * Update list name
 */
exports.updateList = async (req, res, next) => {
  try {
    const list = await TodoList.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name: req.body.name },
      { new: true, runValidators: true }
    );

    if (!list) return next(new AppError('List not found', 404));

    res.json({ list });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/lists/:id
 * Delete a list and all its tasks (cannot delete the default list)
 */
exports.deleteList = async (req, res, next) => {
  try {
    const list = await TodoList.findOne({ _id: req.params.id, userId: req.user.id });

    if (!list) return next(new AppError('List not found', 404));
    if (list.isDefault) return next(new AppError('Cannot delete the default list', 400));

    // Delete all tasks in this list
    await Task.deleteMany({ listId: list._id, userId: req.user.id });

    // Delete the list
    await TodoList.deleteOne({ _id: list._id });

    res.json({ message: 'List and its tasks deleted' });
  } catch (err) {
    next(err);
  }
};
