import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useList } from '../context/ListContext';
import toast from 'react-hot-toast';

const Sidebar = ({ isOpen, onClose }) => {
  const { lists, selectedListId, selectList, addList, editList, removeList } = useList();
  const navigate = useNavigate();

  const [newListName, setNewListName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleSelectList = (id) => {
    selectList(id);
    navigate('/');
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
      navigate('/');
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
            to="/"
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
      </aside>
    </>
  );
};

export default Sidebar;
