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

const TaskCard = ({ task, onToggle, onEdit, onDelete }) => {
  const priorityStyle = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Medium;
  const dotColor = PRIORITY_DOT[task.priority] || PRIORITY_DOT.Medium;

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

  return (
    <div
      className={`bg-dark-card border rounded-xl p-5 transition-all duration-300 hover:border-primary-600/40 ${
        task.completed
          ? 'opacity-60 border-dark-border'
          : isOverdue
          ? 'border-red-500/50 hover:border-red-500/70'
          : 'border-dark-border'
      }`}
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
            <h3
              className={`font-semibold text-lg ${
                task.completed ? 'line-through text-gray-500' : 'text-white'
              }`}
            >
              {task.name}
            </h3>
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

          {task.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
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
          </div>
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
