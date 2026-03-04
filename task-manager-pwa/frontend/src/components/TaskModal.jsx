import { useState, useEffect } from 'react';

const TaskModal = ({ isOpen, onClose, onSubmit, editingTask }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTask) {
      setForm({
        name: editingTask.name || '',
        description: editingTask.description || '',
        priority: editingTask.priority || 'Medium',
        dueDate: editingTask.dueDate
          ? new Date(editingTask.dueDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setForm({ name: '', description: '', priority: 'Medium', dueDate: '' });
    }
    setFile(null);
  }, [editingTask, isOpen]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      let data;
      if (file) {
        data = new FormData();
        data.append('name', form.name);
        data.append('description', form.description);
        data.append('priority', form.priority);
        if (form.dueDate) data.append('dueDate', form.dueDate);
        data.append('file', file);
      } else {
        data = {
          name: form.name,
          description: form.description,
          priority: form.priority,
          dueDate: form.dueDate || null,
        };
      }
      await onSubmit(data, editingTask?._id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Task Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="Enter task name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
              placeholder="Describe your task"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Attachment (PDF, PNG, JPG — max 5MB)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600/20 file:text-primary-400 hover:file:bg-primary-600/30 file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-dark-surface text-gray-400 rounded-lg hover:bg-dark-border transition-colors border border-dark-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
