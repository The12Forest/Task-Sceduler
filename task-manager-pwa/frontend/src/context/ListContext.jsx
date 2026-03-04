import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchLists as fetchListsAPI,
  createList as createListAPI,
  updateList as updateListAPI,
  deleteList as deleteListAPI,
} from '../api/endpoints';
import { cacheLists, getCachedLists } from '../services/indexedDB';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from './AuthContext';

const ListContext = createContext(null);

export const useList = () => {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error('useList must be used within ListProvider');
  return ctx;
};

/** Client-side sort: overdue → today → upcoming → no-date; within group by priority → newest */
const PRIORITY_WEIGHT = { High: 0, Medium: 1, Low: 2 };

export const sortTasks = (tasks) => {
  const now = new Date();
  const todayStr = now.toDateString();

  const getGroup = (task) => {
    if (!task.dueDate) return 3;
    const due = new Date(task.dueDate);
    if (due < now && due.toDateString() !== todayStr) return 0; // overdue
    if (due.toDateString() === todayStr) return 1;              // today
    return 2;                                                    // upcoming
  };

  return [...tasks].sort((a, b) => {
    const ga = getGroup(a);
    const gb = getGroup(b);
    if (ga !== gb) return ga - gb;
    const pa = PRIORITY_WEIGHT[a.priority] ?? 1;
    const pb = PRIORITY_WEIGHT[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
};

const SELECTED_LIST_KEY = 'selectedListId';

export const ListProvider = ({ children }) => {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(
    () => localStorage.getItem(SELECTED_LIST_KEY) || null
  );
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const isOnline = useOnlineStatus();

  // Keep a ref so async callbacks can read current selectedListId without stale closure
  const selectedListIdRef = useRef(selectedListId);
  useEffect(() => { selectedListIdRef.current = selectedListId; }, [selectedListId]);

  const selectList = useCallback((id) => {
    setSelectedListId(id);
    selectedListIdRef.current = id;
    localStorage.setItem(SELECTED_LIST_KEY, id);
  }, []);

  /** Apply a fetched/cached list array, auto-selecting default if needed */
  const applyLists = useCallback(
    (fetchedLists, select) => {
      setLists(fetchedLists);
      const current = selectedListIdRef.current;
      if (fetchedLists.length > 0 && (!current || !fetchedLists.find((l) => l._id === current))) {
        const def = fetchedLists.find((l) => l.isDefault) || fetchedLists[0];
        select(def._id);
      }
    },
    []
  );

  const loadLists = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (isOnline) {
        const res = await fetchListsAPI();
        const fetched = res.data.lists;
        applyLists(fetched, selectList);
        await cacheLists(fetched.map(({ _id, name, isDefault }) => ({ _id, name, isDefault })));
      } else {
        const cached = await getCachedLists();
        if (cached.length > 0) applyLists(cached, selectList);
      }
    } catch (err) {
      console.error('Failed to load lists:', err);
      try {
        const cached = await getCachedLists();
        if (cached.length > 0) applyLists(cached, selectList);
      } catch (_) { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isOnline, applyLists, selectList]);

  useEffect(() => {
    if (isAuthenticated) {
      loadLists();
    } else {
      setLists([]);
      setSelectedListId(null);
    }
  }, [isAuthenticated, loadLists]);

  const addList = useCallback(async (name) => {
    const res = await createListAPI({ name });
    const newList = res.data.list;
    setLists((prev) => [...prev, newList]);
    selectList(newList._id);
    return newList;
  }, [selectList]);

  const editList = useCallback(async (id, name) => {
    const res = await updateListAPI(id, { name });
    setLists((prev) => prev.map((l) => (l._id === id ? res.data.list : l)));
    return res.data.list;
  }, []);

  const removeList = useCallback(
    async (id) => {
      await deleteListAPI(id);
      setLists((prev) => {
        const remaining = prev.filter((l) => l._id !== id);
        if (selectedListIdRef.current === id && remaining.length > 0) {
          const def = remaining.find((l) => l.isDefault) || remaining[0];
          selectList(def._id);
        }
        return remaining;
      });
    },
    [selectList]
  );

  const refreshListCounts = useCallback(async () => {
    try {
      const res = await fetchListsAPI();
      setLists(res.data.lists);
    } catch (_) { /* ignore */ }
  }, []);

  const selectedList = lists.find((l) => l._id === selectedListId) || null;

  const value = {
    lists,
    selectedListId,
    selectedList,
    loading,
    loadLists,
    selectList,
    addList,
    editList,
    removeList,
    refreshListCounts,
    sortTasks,
  };

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
};
