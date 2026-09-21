import React, { useState } from 'react';
import { useFriendMoney } from '../context/FriendMoneyContext.js';
import { Friend, FriendMoneyEntry, FriendEntryType } from '../types/index.js';
import {
  Users, UserPlus, ArrowLeft, ArrowUpRight, ArrowDownLeft,
  Calendar, Edit, Trash2, Plus, ChevronRight,
  HandCoins, Banknote, Clock
} from 'lucide-react';
import {
  AddFriendModal,
  EditFriendModal,
  AddFriendEntryModal,
  EditFriendEntryModal,
  DeleteFriendModal,
  DeleteFriendEntryModal
} from '../components/FriendModals.js';

export const FriendMoneyPage: React.FC = () => {
  const {
    friends,
    loading,
    totals,
    addFriend,
    editFriend,
    deleteFriend,
    addFriendEntry,
    editFriendEntry,
    deleteFriendEntry,
    getFriendSummary,
    getEntriesForFriend
  } = useFriendMoney();

  // Active selected friend ID for detail view
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // Modal States
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [deletingFriend, setDeletingFriend] = useState<Friend | null>(null);

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [addEntryType, setAddEntryType] = useState<FriendEntryType>('given');
  const [editingEntry, setEditingEntry] = useState<FriendMoneyEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FriendMoneyEntry | null>(null);

  const selectedFriend = friends.find(f => f.id === selectedFriendId) || null;
  const selectedSummary = selectedFriendId ? getFriendSummary(selectedFriendId) : null;
  const friendEntries = selectedFriendId ? getEntriesForFriend(selectedFriendId) : [];

  const handleOpenAddEntry = (type: FriendEntryType) => {
    setAddEntryType(type);
    setIsAddEntryOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / HEADER
         ───────────────────────────────────────────────────────────── */}
      {selectedFriend ? (
        /* Friend Detail Header */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedFriendId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Friends</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setEditingFriend(selectedFriend)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
                title="Edit Friend"
                aria-label="Edit Friend"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingFriend(selectedFriend)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shadow-sm"
                title="Delete Friend"
                aria-label="Delete Friend"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Friend Profile Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                {selectedFriend.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                  {selectedFriend.name}
                </h2>
                {selectedFriend.note ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{selectedFriend.note}</p>
                ) : (
                  <p className="text-xs text-slate-400">Friend Tracker Record</p>
                )}
              </div>
            </div>

            {/* Friend Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Total Given</p>
                <p className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  Rs. {(selectedSummary?.totalGiven || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Returned</p>
                <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Rs. {(selectedSummary?.totalReturned || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Remaining</p>
                <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  Rs. {(selectedSummary?.remaining || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleOpenAddEntry('given')}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Give Money</span>
              </button>

              <button
                onClick={() => handleOpenAddEntry('returned')}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Money Returned</span>
              </button>
            </div>
          </div>

          {/* Transaction History Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>History ({friendEntries.length})</span>
              </h3>
            </div>

            {friendEntries.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  <HandCoins className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Money Records Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Click "Give Money" to track money you give to {selectedFriend.name}, or "Money Returned" when they pay back.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenAddEntry('given')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs transition shadow-sm hover:bg-amber-600"
                  >
                    + Give Money
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {friendEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          entry.type === 'given'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {entry.type === 'given' ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownLeft className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              entry.type === 'given'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {entry.type === 'given' ? '+ ' : '- '}
                            Rs. {entry.amount.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              entry.type === 'given'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {entry.note && (
                            <>
                              <span>•</span>
                              <span className="truncate italic text-slate-600 dark:text-slate-300">
                                {entry.note}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pl-2">
                      <button
                        onClick={() => setEditingEntry(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Entry"
                        aria-label="Edit Entry"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingEntry(entry)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Entry"
                        aria-label="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            2. ALL FRIENDS OVERVIEW LIST VIEW
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-5">
          {/* Header & Add Friend CTA */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Friend Money</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track money given to and returned by friends separately from your main budget.
              </p>
            </div>

            <button
              onClick={() => setIsAddFriendOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition flex-shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </button>
          </div>

          {/* Aggregated Grand Totals Banner */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-600/15">
            <div className="flex items-center justify-between pb-3 border-b border-white/15">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                <Banknote className="w-4 h-4" />
                Total Outstanding Remaining
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
              </span>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Rs. {totals.remaining.toLocaleString('en-IN')}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/15 text-xs">
              <div>
                <p className="text-blue-200">Total Money Given</p>
                <p className="font-bold text-sm sm:text-base text-white mt-0.5">
                  Rs. {totals.totalGiven.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-blue-200">Total Money Returned</p>
                <p className="font-bold text-sm sm:text-base text-white mt-0.5">
                  Rs. {totals.totalReturned.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Friends List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Friends ({friends.length})
              </h3>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading friends list...
              </div>
            ) : friends.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Friends Added Yet</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Add a friend to start tracking how much money you gave them, how much was returned, and the remaining balance.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsAddFriendOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Friend</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map(friend => {
                  const summary = getFriendSummary(friend.id);
                  const remaining = summary?.remaining || 0;
                  const given = summary?.totalGiven || 0;
                  const returned = summary?.totalReturned || 0;

                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriendId(friend.id)}
                      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-blue-500/50 dark:hover:border-blue-500/50 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base flex-shrink-0 group-hover:scale-105 transition-transform">
                            {friend.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {friend.name}
                            </h4>
                            {friend.note ? (
                              <p className="text-xs text-slate-400 truncate">{friend.note}</p>
                            ) : (
                              <p className="text-[11px] text-slate-400">
                                {summary?.entriesCount || 0} {summary?.entriesCount === 1 ? 'record' : 'records'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-semibold text-slate-400">Remaining</p>
                            <p className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                              Rs. {remaining.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Detailed Given vs Returned Row */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center justify-between pr-2 border-r border-slate-100 dark:border-slate-800">
                          <span>Given:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Rs. {given.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pl-2">
                          <span>Returned:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Rs. {returned.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. MODALS
         ───────────────────────────────────────────────────────────── */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onAdd={addFriend}
      />

      <EditFriendModal
        isOpen={Boolean(editingFriend)}
        friend={editingFriend}
        onClose={() => setEditingFriend(null)}
        onSave={editFriend}
      />

      <DeleteFriendModal
        isOpen={Boolean(deletingFriend)}
        friend={deletingFriend}
        onClose={() => setDeletingFriend(null)}
        onConfirmDelete={async id => {
          await deleteFriend(id);
          if (selectedFriendId === id) {
            setSelectedFriendId(null);
          }
        }}
      />

      <AddFriendEntryModal
        isOpen={isAddEntryOpen}
        friend={selectedFriend}
        initialType={addEntryType}
        remainingOwed={selectedSummary?.remaining || 0}
        onClose={() => setIsAddEntryOpen(false)}
        onAdd={addFriendEntry}
      />

      <EditFriendEntryModal
        isOpen={Boolean(editingEntry)}
        entry={editingEntry}
        friendName={selectedFriend?.name || 'Friend'}
        onClose={() => setEditingEntry(null)}
        onSave={editFriendEntry}
      />

      <DeleteFriendEntryModal
        isOpen={Boolean(deletingEntry)}
        entry={deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirmDelete={deleteFriendEntry}
      />
    </div>
  );
};
