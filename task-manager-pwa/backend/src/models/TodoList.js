const mongoose = require('mongoose');

const todoListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'List name is required'],
      trim: true,
      maxlength: [100, 'List name cannot exceed 100 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for efficient user queries
todoListSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('TodoList', todoListSchema);
