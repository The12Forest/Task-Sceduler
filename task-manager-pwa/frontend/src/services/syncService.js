import { syncTasks as syncTasksAPI } from '../api/endpoints';
import {
  getUnsyncedTasks,
  markTaskSynced,
  markTaskFailed,
  clearSyncedTasks,
} from './indexedDB';

/**
 * Attempt to sync all pending offline tasks to the server.
 * Returns the number of successfully synced tasks.
 */
export const syncOfflineTasks = async () => {
  const unsyncedTasks = await getUnsyncedTasks();

  if (unsyncedTasks.length === 0) return 0;

  try {
    // Extract task data (strip IndexedDB metadata, keep listId)
    const taskPayloads = unsyncedTasks.map(
      ({ name, description, priority, dueDate, completed, listId }) => ({
        name,
        description,
        priority,
        dueDate,
        completed,
        listId,
      })
    );

    await syncTasksAPI(taskPayloads);

    // Mark all as synced
    for (const task of unsyncedTasks) {
      await markTaskSynced(task.localId);
    }

    // Clean up synced entries
    await clearSyncedTasks();

    return unsyncedTasks.length;
  } catch (error) {
    console.error('Sync failed:', error);

    // Mark as failed for retry
    for (const task of unsyncedTasks) {
      await markTaskFailed(task.localId);
    }

    return 0;
  }
};

