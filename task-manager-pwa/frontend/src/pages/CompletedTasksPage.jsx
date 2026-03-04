import { useTask } from '../context/TaskContext';
import { useList } from '../context/ListContext';
import { useSidebarOpen } from '../App';
import toast from 'react-hot-toast';

const CompletedTasksPage = () => {
  const { completedTasks, loading, toggleComplete, removeTask } = useTask();
  const { selectedList } = useList();
  const openSidebar = useSidebarOpen();

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleUncomplete = async (id, completed) => {
    try {
      await toggleComplete(id, completed);
      toast.success('Task moved back to active');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this completed task?')) return;
    try {
      await removeTask(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={openSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Completed Tasks</h1>
          <p className="text-gray-400 mt-1">
            {selectedList ? (
              <>
                From <span className="text-green-400 font-medium">{selectedList.name}</span>
              </>
            ) : (
              'All completed tasks'
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : completedTasks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No completed tasks yet</h3>
          <p className="text-gray-500">Finish some tasks and they'll appear here.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed</p>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <div
                key={task._id || task.localId}
                className="bg-dark-card border border-dark-border rounded-xl p-5 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-start gap-3">
                  {/* Re-open checkbox */}
                  <button
                    onClick={() => handleUncomplete(task._id || task.localId, task.completed)}
                    className="mt-0.5 w-5 h-5 rounded border-2 bg-green-600 border-green-600 flex items-center justify-center flex-shrink-0 hover:bg-green-700 hover:border-green-700 transition-colors"
                    title="Mark as active"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg line-through text-gray-500">
                      {task.name}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${
                        task.priority === 'High'
                          ? 'bg-red-600/10 text-red-400 border-red-600/20'
                          : task.priority === 'Medium'
                          ? 'bg-yellow-600/10 text-yellow-400 border-yellow-600/20'
                          : 'bg-gray-600/10 text-gray-400 border-gray-600/20'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(task._id || task.localId)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CompletedTasksPage;
