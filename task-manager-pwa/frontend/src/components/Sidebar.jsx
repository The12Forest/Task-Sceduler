import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useList } from '../context/ListContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
  const { lists, selectedListId, selectList, addList, editList, removeList } = useList();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [newListName, setNewListName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleSelectList = (id) => {
    selectList(id);
    navigate('/dashboard');
    onClose?.();
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;
    try {
      await addList(name);
      setNewListName('');
      setShowNewInput(false);
      navigate('/dashboard');
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create list');
    }
  };

  const handleStartEdit = (list) => {
    setEditingId(list._id);
    setEditingName(list.name);
  };

  const handleSaveEdit = async (id) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      await editList(id, name);
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename list');
    }
  };

  const handleDeleteList = async (id) => {
    if (!window.confirm('Delete this list and all its tasks? This cannot be undone.')) return;
    try {
      await removeList(id);
      toast.success('List deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete list');
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-dark-card border-r border-dark-border flex flex-col z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation */}
        <nav className="p-4 border-b border-dark-border space-y-1">
          <NavLink
            to="/dashboard"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:bg-dark-surface hover:text-white'
              }`
            }
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </NavLink>

          <NavLink
            to="/completed"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-600/20 text-green-400'
                  : 'text-gray-400 hover:bg-dark-surface hover:text-white'
              }`
            }
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Completed Tasks
          </NavLink>
        </nav>

        {/* Lists */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              My Lists
            </h3>
            <button
              onClick={() => setShowNewInput((v) => !v)}
              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-primary-400 transition-colors"
              title="New list"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* New List Input */}
          {showNewInput && (
            <form onSubmit={handleCreateList} className="mb-3">
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="List name..."
                  className="flex-1 px-3 py-1.5 bg-dark-surface border border-dark-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-2 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {/* List Items */}
          <ul className="space-y-1">
            {lists.map((list) => (
              <li key={list._id}>
                {editingId === list._id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(list._id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 px-3 py-1.5 bg-dark-surface border border-primary-500 rounded-lg text-sm text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(list._id)}
                      className="px-2 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedListId === list._id
                        ? 'bg-primary-600/20 text-white'
                        : 'text-gray-400 hover:bg-dark-surface hover:text-white'
                    }`}
                    onClick={() => handleSelectList(list._id)}
                  >
                    {/* List icon */}
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>

                    <span className="flex-1 text-sm truncate">{list.name}</span>

                    {/* Task count badge */}
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {list.taskCount ?? 0}
                    </span>

                    {/* Edit / Delete actions (hover, non-default lists) */}
                    {!list.isDefault && (
                      <div className="hidden group-hover:flex items-center gap-1 ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(list);
                          }}
                          className="p-0.5 text-gray-500 hover:text-primary-400"
                          title="Rename"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list._id);
                          }}
                          className="p-0.5 text-gray-500 hover:text-red-400"
                          title="Delete list"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom nav: Settings + Admin */}
        <nav className="p-4 border-t border-dark-border space-y-1">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-gray-400 hover:bg-dark-surface hover:text-white'
              }`
            }
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </NavLink>

          {isAdmin && (
            <>
              <div className="pt-2 pb-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">Admin</h3>
              </div>
              <NavLink
                to="/admin"
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-gray-400 hover:bg-dark-surface hover:text-white'
                  }`
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-gray-400 hover:bg-dark-surface hover:text-white'
                  }`
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </NavLink>
              <NavLink
                to="/admin/settings"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-gray-400 hover:bg-dark-surface hover:text-white'
                  }`
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                System Config
              </NavLink>
              <NavLink
                to="/admin/audit"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-red-600/20 text-red-400'
                      : 'text-gray-400 hover:bg-dark-surface hover:text-white'
                  }`
                }
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Log
              </NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
