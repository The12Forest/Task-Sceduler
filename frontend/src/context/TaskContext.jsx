import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchTasks as fetchTasksAPI,
  createTask as createTaskAPI,
  updateTask as updateTaskAPI,
  deleteTask as deleteTaskAPI,
  toggleSubtask as toggleSubtaskAPI,
  fetchUserTags as fetchUserTagsAPI,
} from '../api/endpoints';
import { saveOfflineTask, getAllOfflineTasks } from '../services/indexedDB';
import { syncOfflineTasks } from '../services/syncService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from './AuthContext';
import { useList } from './ListContext';
import { scheduleTaskNotifications } from '../services/notificationService';

const TaskContext = createContext(null);

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within TaskProvider');
  return ctx;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userTags, setUserTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const { isAuthenticated } = useAuth();
  const isOnline = useOnlineStatus();
  const { selectedListId, sortTasks, refreshListCounts } = useList();

  // Fetch tasks for the currently selected list
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated || !selectedListId) return;
    setLoading(true);
    try {
      if (isOnline) {
        const res = await fetchTasksAPI({ listId: selectedListId });
        setTasks(res.data.tasks);
      } else {
        // Show offline tasks belonging to this list
        const offlineTasks = await getAllOfflineTasks();
        const listTasks = offlineTasks.filter(
          (ot) =>
            ot.listId === selectedListId &&
            (ot.syncStatus === 'pending' || ot.syncStatus === 'failed')
        );
        setTasks((prev) => {
          const serverIds = new Set(prev.map((t) => t._id).filter(Boolean));
          const newOffline = listTasks.filter((t) => !serverIds.has(t._id));
          return [...prev, ...newOffline];
        });
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isOnline, selectedListId]);

  // Fetch user's unique tags
  const loadUserTags = useCallback(async () => {
    if (!isAuthenticated || !isOnline) return;
    try {
      const res = await fetchUserTagsAPI();
      setUserTags(res.data.tags || []);
    } catch {
      /* non-critical */
    }
  }, [isAuthenticated, isOnline]);

  useEffect(() => {
    loadTasks();
    loadUserTags();
  }, [loadTasks, loadUserTags]);

  // Schedule notifications whenever tasks change
  useEffect(() => {
    if (tasks.length === 0) return;
    const cleanup = scheduleTaskNotifications(tasks);
    return cleanup;
  }, [tasks]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && isAuthenticated) {
      syncOfflineTasks().then((synced) => {
        if (synced > 0) {
          loadTasks();
          refreshListCounts();
        }
      });
    }
  }, [isOnline, isAuthenticated, loadTasks, refreshListCounts]);

  const addTask = useCallback(
    async (taskData) => {
      // Attach listId from context if not explicitly provided
      const dataWithList =
        taskData instanceof FormData
          ? taskData
          : { ...taskData, listId: taskData.listId || selectedListId };

      if (taskData instanceof FormData && !taskData.get('listId')) {
        taskData.set('listId', selectedListId);
      }

      if (isOnline) {
        const res = await createTaskAPI(dataWithList);
        setTasks((prev) => [res.data.task, ...prev]);
        refreshListCounts();
        loadUserTags();
        return res.data.task;
      } else {
        const offlineTask = await saveOfflineTask(
          taskData instanceof FormData
            ? Object.fromEntries(taskData.entries())
            : { ...taskData, listId: selectedListId }
        );
        setTasks((prev) => [offlineTask, ...prev]);
        return offlineTask;
      }
    },
    [isOnline, selectedListId, refreshListCounts]
  );

  const editTask = useCallback(async (id, taskData) => {
    const res = await updateTaskAPI(id, taskData);
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
    return res.data.task;
  }, []);

  const removeTask = useCallback(
    async (id) => {
      await deleteTaskAPI(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      refreshListCounts();
    },
    [refreshListCounts]
  );

  const toggleComplete = useCallback(async (id, completed) => {
    const res = await updateTaskAPI(id, { completed: !completed });
    setTasks((prev) => prev.map((t) => (t._id === id ? res.data.task : t)));
  }, []);

  const toggleSubtaskComplete = useCallback(async (taskId, subtaskId) => {
    const res = await toggleSubtaskAPI(taskId, subtaskId);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
  }, []);

  // Separate active and completed
  const activeTasks = sortTasks(
    tasks.filter((t) => {
      if (t.completed) return false;
      if (activeTag && !(t.tags || []).includes(activeTag)) return false;
      return true;
    })
  );
  const completedTasks = tasks.filter((t) => t.completed);

  // Stats (active tasks only for current list; overdue counts as dueToday)
  const now = new Date();
  const todayStr = now.toDateString();
  const stats = {
    total: activeTasks.length,
    completed: completedTasks.length,
    dueToday: activeTasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      // Include overdue + due today
      return due <= now || due.toDateString() === todayStr;
    }).length,
  };

  const value = {
    tasks: activeTasks,       // sorted active tasks for dashboard
    allTasks: tasks,          // raw unsorted full list (for edge cases)
    completedTasks,           // completed tasks for /completed page
    loading,
    stats,
    userTags,
    activeTag,
    setActiveTag,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    toggleComplete,
    toggleSubtaskComplete,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
