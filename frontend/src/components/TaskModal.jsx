import { useState, useEffect } from 'react';

const TaskModal = ({ isOpen, onClose, onSubmit, editingTask }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    tags: [],
    selfDestruct: false,
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [subtaskInput, setSubtaskInput] = useState('');
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    if (editingTask) {
      setForm({
        name: editingTask.name || '',
        description: editingTask.description || '',
        priority: editingTask.priority || 'Medium',
        dueDate: editingTask.dueDate
          ? new Date(editingTask.dueDate).toISOString().split('T')[0]
          : '',
        tags: editingTask.tags || [],
        selfDestruct: editingTask.selfDestruct || false,
      });
      setSubtasks(
        (editingTask.subtasks || []).map((s) => ({
          name: s.name,
          completed: s.completed,
          _id: s._id,
        }))
      );
    } else {
      setForm({ name: '', description: '', priority: 'Medium', dueDate: '', tags: [], selfDestruct: false });
      setSubtasks([]);
    }
    setFile(null);
    setTagInput('');
    setSubtaskInput('');
  }, [editingTask, isOpen]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addTag = () => {
    const tag = tagInput.replace(/^#/, '').trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const addSubtask = () => {
    const name = subtaskInput.trim();
    if (name) {
      setSubtasks((prev) => [...prev, { name, completed: false }]);
      setSubtaskInput('');
    }
  };

  const removeSubtask = (index) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
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
        data.append('tags', JSON.stringify(form.tags));
        data.append('subtasks', JSON.stringify(subtasks));
        data.append('selfDestruct', form.selfDestruct);
        data.append('file', file);
      } else {
        data = {
          name: form.name,
          description: form.description,
          priority: form.priority,
          dueDate: form.dueDate || null,
          tags: form.tags,
          subtasks: subtasks.map((s) => ({ name: s.name, completed: s.completed || false })),
          selfDestruct: form.selfDestruct,
        };
      }
      await onSubmit(data, editingTask?._id);
      onClose();
    } catch {
      // Error handling is done by the caller (TaskProvider) which shows toasts
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
      <div className="relative bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Task Name *
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="Enter task name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none"
              placeholder="Describe your task"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                placeholder="#work, #urgent..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-600/15 text-primary-400 border border-primary-600/20"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-400 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Subtasks
            </label>
            <div className="flex gap-2">
              <input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                className="flex-1 px-4 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 text-sm"
                placeholder="Add a subtask..."
              />
              <button
                type="button"
                onClick={addSubtask}
                className="px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
              >
                Add
              </button>
            </div>
            {subtasks.length > 0 && (
              <ul className="mt-2 space-y-1">
                {subtasks.map((sub, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between px-3 py-1.5 bg-dark-surface rounded-lg"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">{sub.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(i)}
                      className="text-gray-500 hover:text-red-400 text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Self-Destruct Toggle */}
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg border border-dark-border">
            <div>
              <p className="text-sm text-gray-900 dark:text-white font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                Burn on Completion
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Auto-delete 60s after completing</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, selfDestruct: !prev.selfDestruct }))}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.selfDestruct ? 'bg-orange-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  form.selfDestruct ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
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
              className="flex-1 px-4 py-2.5 bg-dark-surface text-gray-500 dark:text-gray-400 rounded-lg hover:bg-dark-border transition-colors border border-dark-border"
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
