const mongoose = require('mongoose');

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
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
taskSchema.index({ userId: 1, listId: 1, completed: 1, dueDate: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);
