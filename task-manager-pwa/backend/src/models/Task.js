const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    completed: { type: Boolean, default: false },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TodoList',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Task name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    // ── Tags (hashtag system) ──
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    // ── Sub-tasks ──
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
    // ── Self-destruct: burn task data X seconds after completion ──
    selfDestruct: {
      type: Boolean,
      default: false,
    },
    selfDestructAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
taskSchema.index({ userId: 1, listId: 1, completed: 1, dueDate: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);
