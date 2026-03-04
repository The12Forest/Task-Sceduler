import { openDB } from 'idb';

const DB_NAME = 'taskManagerDB';
const DB_VERSION = 2;
const TASK_STORE = 'offlineTasks';
const LIST_STORE = 'cachedLists';

/**
 * Open (or upgrade) the IndexedDB database
 */
const getDB = () =>
  openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      // v1 → create task store
      if (oldVersion < 1) {
        const store = db.createObjectStore(TASK_STORE, {
          keyPath: 'localId',
          autoIncrement: true,
        });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('listId', 'listId', { unique: false });
      }
      // v2 → add list cache store; add listId index to existing task store
      if (oldVersion >= 1 && oldVersion < 2) {
        // Add listId index to existing task store via upgrade transaction
        const taskStore = tx.objectStore(TASK_STORE);
        if (!taskStore.indexNames.contains('listId')) {
          taskStore.createIndex('listId', 'listId', { unique: false });
        }
      }
      // Always ensure list store exists (whether coming from v0 or v1)
      if (!db.objectStoreNames.contains(LIST_STORE)) {
        db.createObjectStore(LIST_STORE, { keyPath: '_id' });
      }
    },
  });

// ──── Offline Task Operations ────

/**
 * Save a task to IndexedDB for offline queue
 */
export const saveOfflineTask = async (task) => {
  const db = await getDB();
  const offlineTask = {
    ...task,
    timestamp: Date.now(),
    syncStatus: 'pending', // 'pending' | 'synced' | 'failed'
  };
  const id = await db.add(TASK_STORE, offlineTask);
  return { ...offlineTask, localId: id };
};

/**
 * Get all unsynced tasks
 */
export const getUnsyncedTasks = async () => {
  const db = await getDB();
  const tx = db.transaction(TASK_STORE, 'readonly');
  const index = tx.store.index('syncStatus');
  return index.getAll('pending');
};

/**
 * Mark a task as synced
 */
export const markTaskSynced = async (localId) => {
  const db = await getDB();
  const tx = db.transaction(TASK_STORE, 'readwrite');
  const task = await tx.store.get(localId);
  if (task) {
    task.syncStatus = 'synced';
    await tx.store.put(task);
  }
  await tx.done;
};

/**
 * Mark a task as failed
 */
export const markTaskFailed = async (localId) => {
  const db = await getDB();
  const tx = db.transaction(TASK_STORE, 'readwrite');
  const task = await tx.store.get(localId);
  if (task) {
    task.syncStatus = 'failed';
    await tx.store.put(task);
  }
  await tx.done;
};

/**
 * Remove all synced tasks from IndexedDB
 */
export const clearSyncedTasks = async () => {
  const db = await getDB();
  const tx = db.transaction(TASK_STORE, 'readwrite');
  const index = tx.store.index('syncStatus');
  let cursor = await index.openCursor('synced');
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

/**
 * Get all offline tasks (for display while offline)
 */
export const getAllOfflineTasks = async () => {
  const db = await getDB();
  return db.getAll(TASK_STORE);
};

// ──── Offline List Cache Operations ────

/**
 * Cache a list of todo lists locally for offline use
 */
export const cacheLists = async (lists) => {
  const db = await getDB();
  const tx = db.transaction(LIST_STORE, 'readwrite');
  await tx.store.clear();
  for (const list of lists) {
    await tx.store.put(list);
  }
  await tx.done;
};

/**
 * Get all cached lists
 */
export const getCachedLists = async () => {
  const db = await getDB();
  return db.getAll(LIST_STORE);
};

