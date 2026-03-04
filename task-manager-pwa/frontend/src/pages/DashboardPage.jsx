import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTask } from '../context/TaskContext';
import { useList } from '../context/ListContext';
import { useSidebarOpen } from '../App';
import StatsCards from '../components/StatsCards';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { requestNotificationPermission } from '../services/notificationService';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, loading, stats, addTask, editTask, removeTask, toggleComplete } = useTask();
  const { selectedList } = useList();
  const openSidebar = useSidebarOpen();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Request notification permission on first load
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCreateOrEdit = async (data, taskId) => {
    try {
      if (taskId) {
        await editTask(taskId, data);
        toast.success('Task updated');
      } else {
        await addTask(data);
        toast.success('Task created');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await removeTask(id);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleInlineUpdate = async (id, data) => {
    try {
      await editTask(id, data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Greeting */}
      <div className="mb-6">
        {/* Mobile sidebar toggle */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={openSidebar}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-white">
            {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
        </div>
        <p className="text-gray-400">
          {selectedList ? (
            <>
              Viewing <span className="text-primary-400 font-medium">{selectedList.name}</span>
            </>
          ) : (
            "Here's an overview of your tasks"
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatsCards stats={stats} />
      </div>

      {/* Task Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          {selectedList?.name || 'Tasks'}
          {tasks.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({tasks.length})
            </span>
          )}
        </h2>
        <button
          onClick={openNewTaskModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-dark-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No active tasks</h3>
          <p className="text-gray-500 mb-6">Create your first task to get started</p>
          <button
            onClick={openNewTaskModal}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id || task.localId}
              task={task}
              onToggle={toggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onInlineUpdate={handleInlineUpdate}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrEdit}
        editingTask={editingTask}
      />
    </div>
  );
};

export default DashboardPage;
