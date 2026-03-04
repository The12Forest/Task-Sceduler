import { useState, useRef, useEffect } from 'react';

const PRIORITY_STYLES = {
  Low: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  Medium: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
  High: 'bg-red-600/20 text-red-400 border-red-600/30',
};

const PRIORITY_DOT = {
  Low: 'bg-gray-400',
  Medium: 'bg-yellow-400',
  High: 'bg-red-400',
};

/**
 * Calculate ghost opacity for overdue tasks.
 * The further past due, the more faded (min 0.3).
 */
const getGhostOpacity = (task) => {
  if (task.completed || !task.dueDate) return 1;
  const now = new Date();
  const due = new Date(task.dueDate);
  if (due >= now) return 1;
  const daysPast = (now - due) / (1000 * 60 * 60 * 24);
  // Fade from 1.0 to 0.3 over 14 days
  return Math.max(0.3, 1 - daysPast * 0.05);
};

const TaskCard = ({ task, onToggle, onEdit, onDelete, onInlineUpdate, onSubtaskToggle }) => {
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;
  const dotColor = PRIORITY_DOT[task.priority] || PRIORITY_DOT.Medium;

  // Inline edit state
  const [editingField, setEditingField] = useState(null); // 'name' | 'description' | null
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef(null);

  // Self-destruct countdown
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  // Self-destruct countdown timer
  useEffect(() => {
    if (!task.selfDestructAt) { setCountdown(null); return; }
    const update = () => {
      const remaining = Math.max(0, Math.ceil((new Date(task.selfDestructAt) - new Date()) / 1000));
      setCountdown(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [task.selfDestructAt]);

  const startEdit = (field) => {
    setEditingField(field);
    setEditValue(field === 'name' ? task.name : task.description || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const commitEdit = () => {
    if (!editingField) return;
    const trimmed = editValue.trim();
    // Name cannot be empty
    if (editingField === 'name' && !trimmed) {
      cancelEdit();
      return;
    }
    const oldVal = editingField === 'name' ? task.name : task.description || '';
    if (trimmed !== oldVal && onInlineUpdate) {
      onInlineUpdate(task._id || task.localId, { [editingField]: trimmed });
    }
    cancelEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  const ghostOpacity = getGhostOpacity(task);
  const subtasksDone = (task.subtasks || []).filter((s) => s.completed).length;
  const subtasksTotal = (task.subtasks || []).length;
  const subtaskProgress = subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0;

  return (
    <div
      className={`bg-dark-card border rounded-xl p-5 transition-all duration-300 hover:border-primary-600/40 ${
        task.completed
          ? 'border-dark-border'
          : isOverdue
          ? 'border-red-500/50 hover:border-red-500/70'
          : 'border-dark-border'
      }`}
      style={{ opacity: task.completed ? 0.6 : ghostOpacity }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task._id || task.localId, task.completed)}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            task.completed
              ? 'bg-primary-600 border-primary-600'
              : 'border-gray-500 hover:border-primary-400'
          }`}
        >
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {editingField === 'name' ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                className="bg-dark-surface border border-primary-500/50 rounded px-2 py-0.5 text-gray-900 dark:text-white font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-primary-500/40 w-full max-w-md"
              />
            ) : (
              <h3
                onClick={() => !task.completed && startEdit('name')}
                className={`font-semibold text-lg cursor-text ${
                  task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white hover:text-primary-300'
                }`}
                title={task.completed ? '' : 'Click to edit'}
              >
                {task.name}
              </h3>
            )}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${priorityStyle}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              {task.priority}
            </span>
            {task.syncStatus === 'pending' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                Offline
              </span>
            )}
          </div>

          {editingField === 'description' ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              placeholder="Add a description…"
              className="mt-1 w-full bg-dark-surface border border-primary-500/50 rounded px-2 py-1 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          ) : (
            <p
              onClick={() => !task.completed && startEdit('description')}
              className={`text-sm mt-1 line-clamp-2 cursor-text ${
                task.description
                  ? 'text-gray-400 hover:text-gray-300'
                  : task.completed
                  ? 'hidden'
                  : 'text-gray-600 italic hover:text-gray-400'
              }`}
              title={task.completed ? '' : 'Click to edit'}
            >
              {task.description || (task.completed ? '' : 'Add a description…')}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(task.dueDate)}
                {isOverdue && ' (Overdue)'}
              </span>
            )}
            {task.fileUrl && (
              <a
                href={task.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-400 hover:text-primary-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attachment
              </a>
            )}
            {/* Self-destruct indicator */}
            {task.selfDestruct && (
              <span className="flex items-center gap-1 text-orange-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                {countdown !== null && countdown > 0 ? `${countdown}s` : task.completed ? 'Burning...' : 'Burn'}
              </span>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary-600/15 text-primary-400 border border-primary-600/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Subtask progress */}
          {subtasksTotal > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">
                  Subtasks {subtasksDone}/{subtasksTotal}
                </span>
                <span className="text-xs text-gray-500">{Math.round(subtaskProgress)}%</span>
              </div>
              <div className="w-full h-1.5 bg-dark-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
              {/* Subtask items */}
              <div className="mt-2 space-y-0.5">
                {task.subtasks.map((sub) => (
                  <button
                    key={sub._id}
                    onClick={() => onSubtaskToggle && onSubtaskToggle(task._id || task.localId, sub._id)}
                    className="flex items-center gap-2 w-full text-left py-1.5 px-1 -mx-1 rounded-md group/sub hover:bg-dark-surface/50 transition-colors min-h-[36px]"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        sub.completed
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-gray-500 group-hover/sub:border-primary-400'
                      }`}
                    >
                      {sub.completed && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span
                      className={`text-xs ${
                        sub.completed ? 'text-gray-500 line-through' : 'text-gray-500 dark:text-gray-400 group-hover/sub:text-gray-700 dark:group-hover/sub:text-gray-300'
                      }`}
                    >
                      {sub.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-500 hover:text-primary-400 hover:bg-primary-600/10 rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(task._id || task.localId)}
            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
