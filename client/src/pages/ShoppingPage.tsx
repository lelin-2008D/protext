import React, { useState, useMemo } from 'react';
import { useShopping } from '../context/ShoppingContext.js';
import { useTransactions } from '../context/TransactionContext.js';
import { ShoppingList, ShoppingItem } from '../types/index.js';
import {
  ShoppingBag, Plus, ArrowLeft, CheckCircle2,
  Edit, Trash2, Copy, RotateCcw, Archive, Check,
  ChevronRight, Search, ExternalLink
} from 'lucide-react';
import {
  CreateListModal,
  EditListModal,
  DeleteListModal,
  AddItemModal,
  EditItemModal,
  MarkPurchasedModal,
  UndoPurchaseModal,
  formatNPR,
  NEPAL_SHOPPING_UNITS
} from '../components/ShoppingModals.js';

interface ShoppingPageProps {
  onNavigateToHistory?: () => void;
}

export const ShoppingPage: React.FC<ShoppingPageProps> = ({ onNavigateToHistory }) => {
  const {
    lists,
    activeLists,
    completedLists,
    archivedLists,
    createList,
    updateList,
    completeList,
    archiveList,
    reopenList,
    deleteList,
    addItem,
    editItem,
    duplicateItem,
    deleteItem,
    purchaseItem,
    undoPurchase,
    getItemsForList,
    getListSummary
  } = useShopping();

  const { categories } = useTransactions();

  // Navigation State
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'archived'>('active');
  const [itemFilter, setItemFilter] = useState<'all' | 'pending' | 'purchased'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [deletingList, setDeletingList] = useState<ShoppingList | null>(null);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [purchasingItem, setPurchasingItem] = useState<ShoppingItem | null>(null);
  const [undoingItem, setUndoingItem] = useState<ShoppingItem | null>(null);

  // Quick Inline Add State on Desktop Detail View
  const [quickName, setQuickName] = useState('');
  const [quickQuantity, setQuickQuantity] = useState('1');
  const [quickUnit, setQuickUnit] = useState<string>('piece');
  const [quickEstPrice, setQuickEstPrice] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Toast / notification state
  const [purchaseToast, setPurchaseToast] = useState<{
    itemName: string;
    amount: number;
    transactionId: string;
  } | null>(null);

  const selectedList = lists.find(l => l.id === selectedListId) || null;
  const listSummary = selectedListId ? getListSummary(selectedListId) : null;
  const listItems = selectedListId ? getItemsForList(selectedListId) : [];

  // Filtered Items for Detail View
  const filteredItems = useMemo(() => {
    return listItems.filter(item => {
      if (itemFilter === 'pending' && item.status !== 'pending') return false;
      if (itemFilter === 'purchased' && item.status !== 'purchased') return false;
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesUnit = item.unit?.toLowerCase().includes(query);
        return matchesName || matchesNotes || matchesUnit;
      }
      return true;
    });
  }, [listItems, itemFilter, searchQuery]);

  // Quick desktop add handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !quickName.trim() || quickSubmitting) return;

    try {
      setQuickSubmitting(true);
      const q = parseFloat(quickQuantity);
      const estP = quickEstPrice.trim() !== '' ? parseFloat(quickEstPrice) : null;

      await addItem(selectedListId, {
        name: quickName.trim(),
        quantity: !isNaN(q) && q > 0 ? q : 1,
        unit: quickUnit,
        estimated_unit_price: estP !== null && !isNaN(estP) && estP >= 0 ? estP : null,
        category_name: 'Shopping'
      });

      setQuickName('');
      setQuickQuantity('1');
      setQuickEstPrice('');
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleConfirmPurchase = async (params: {
    itemId: string;
    actual_unit_price: number;
    quantity: number;
    category_name: string;
    purchase_date: string;
  }) => {
    const res = await purchaseItem(params);
    setPurchaseToast({
      itemName: res.item.name,
      amount: res.transaction.amount,
      transactionId: res.transaction.id
    });
    setTimeout(() => {
      setPurchaseToast(null);
    }, 6000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* ─────────────────────────────────────────────────────────────
          PURCHASE SUCCESS NOTIFICATION TOAST
         ───────────────────────────────────────────────────────────── */}
      {purchaseToast && (
        <div className="fixed bottom-20 md:bottom-8 right-4 left-4 md:left-auto md:max-w-md z-50 p-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                Purchased: {purchaseToast.itemName}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-600">
                Expense of {formatNPR(purchaseToast.amount)} recorded
              </p>
            </div>
          </div>
          {onNavigateToHistory && (
            <button
              onClick={() => {
                setPurchaseToast(null);
                onNavigateToHistory();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-slate-900/10 text-xs font-semibold hover:bg-white/20 transition shrink-0"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER / NAVIGATION
         ───────────────────────────────────────────────────────────── */}
      {selectedList ? (
        /* DETAIL VIEW HEADER */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedListId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lists</span>
            </button>

            {/* List Actions Menu */}
            <div className="flex items-center gap-1.5">
              {selectedList.status === 'active' ? (
                <>
                  <button
                    onClick={() => completeList(selectedList.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-sm"
                    title="Mark list completed"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Complete</span>
                  </button>
                  <button
                    onClick={() => archiveList(selectedList.id)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 transition shadow-sm"
                    title="Archive List"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => reopenList(selectedList.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reopen List</span>
                </button>
              )}

              <button
                onClick={() => setEditingList(selectedList)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 transition shadow-sm"
                title="Edit List"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => setDeletingList(selectedList)}
                className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 transition shadow-sm"
                title="Delete List"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Title Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {selectedList.title}
                  </h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedList.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      : selectedList.status === 'archived'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                  }`}>
                    {selectedList.status}
                  </span>
                </div>
                {selectedList.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedList.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsAddItemOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 transition shadow-sm shadow-blue-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            {/* Progress Bar & Summary Stats */}
            {listSummary && (
              <div className="pt-2 space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Progress: {listSummary.purchasedItemsCount} of {listSummary.totalItems} items purchased
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      {listSummary.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full finance-gradient-action rounded-full transition-all duration-300"
                      style={{ width: `${listSummary.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500 font-medium">Estimated Budget</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {formatNPR(listSummary.estimatedTotal)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Actual Spent</p>
                    <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200 mt-0.5">
                      {formatNPR(listSummary.actualPurchasedTotal)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40">
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Remaining Estimate</p>
                    <p className="text-sm font-extrabold text-blue-800 dark:text-blue-200 mt-0.5">
                      {formatNPR(listSummary.remainingEstimatedTotal)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <p className="text-[11px] text-slate-500 font-medium">Items Pending</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {listSummary.pendingItemsCount}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Bar on Desktop */}
          <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <form onSubmit={handleQuickAdd} className="flex items-center gap-3">
              <input
                type="text"
                value={quickName}
                onChange={e => setQuickName(e.target.value)}
                placeholder="Quick add item (e.g. Masuro Daal, Sunflower Oil)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                step="any"
                min="0.01"
                value={quickQuantity}
                onChange={e => setQuickQuantity(e.target.value)}
                placeholder="Qty"
                className="w-20 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={quickUnit}
                onChange={e => setQuickUnit(e.target.value)}
                className="w-24 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NEPAL_SHOPPING_UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <input
                type="number"
                step="any"
                min="0"
                value={quickEstPrice}
                onChange={e => setQuickEstPrice(e.target.value)}
                placeholder="Est. Rs."
                className="w-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!quickName.trim() || quickSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 disabled:opacity-50 transition shadow-sm"
              >
                Add
              </button>
            </form>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setItemFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  itemFilter === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({listItems.length})
              </button>
              <button
                onClick={() => setItemFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  itemFilter === 'pending'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Pending ({listItems.filter(i => i.status === 'pending').length})
              </button>
              <button
                onClick={() => setItemFilter('purchased')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  itemFilter === 'purchased'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Purchased ({listItems.filter(i => i.status === 'purchased').length})
              </button>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              SHOPPING ITEMS LIST
             ───────────────────────────────────────────────────────────── */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {listItems.length === 0 ? 'No items in this list yet' : 'No items matching filter'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {listItems.length === 0
                  ? 'Add items like rice, oil, vegetables, or stationery before shopping.'
                  : 'Try clearing your search query or changing the filter tab.'}
              </p>
              {listItems.length === 0 && (
                <button
                  onClick={() => setIsAddItemOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Item</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map(item => {
                const isPurchased = item.status === 'purchased';
                const estTotal = item.estimated_unit_price != null
                  ? Math.round((item.quantity || 1) * item.estimated_unit_price * 100) / 100
                  : null;
                const actTotal = item.actual_unit_price != null
                  ? Math.round((item.quantity || 1) * item.actual_unit_price * 100) / 100
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isPurchased
                        ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 shadow-sm'
                    }`}
                  >
                    {/* Left: Checkbox & Name */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        onClick={() => {
                          if (isPurchased) {
                            setUndoingItem(item);
                          } else {
                            setPurchasingItem(item);
                          }
                        }}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                          isPurchased
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50/50'
                        }`}
                        title={isPurchased ? 'Click to undo purchase' : 'Mark as purchased'}
                        aria-label={isPurchased ? 'Purchased checkbox' : 'Pending checkbox'}
                      >
                        {isPurchased && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-bold truncate ${
                            isPurchased
                              ? 'line-through text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}>
                            {item.name}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-semibold">
                            {item.quantity} {item.unit || 'pc'}
                          </span>

                          {isPurchased && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                              Purchased
                            </span>
                          )}
                        </div>

                        {/* Price Details */}
                        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                          {isPurchased && actTotal !== null ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              Actual: Rs. {item.actual_unit_price} / {item.unit || 'pc'} • Total: {formatNPR(actTotal)}
                            </span>
                          ) : estTotal !== null ? (
                            <span>
                              Est. Unit: Rs. {item.estimated_unit_price} • Total: <strong className="text-slate-800 dark:text-slate-200">{formatNPR(estTotal)}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Price not set yet</span>
                          )}

                          {item.notes && (
                            <span className="text-slate-400">• {item.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {!isPurchased ? (
                        <button
                          onClick={() => setPurchasingItem(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-sm"
                        >
                          Buy
                        </button>
                      ) : (
                        <button
                          onClick={() => setUndoingItem(item)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Undo Purchase"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => duplicateItem(item.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:inline-block"
                        title="Duplicate Item"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            LISTS OVERVIEW VIEW
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Shopping Planner
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Plan grocery and bazaar purchases • Auto-records expenses in Nepal
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateListOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-white finance-gradient-action hover:opacity-95 transition shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>New List</span>
            </button>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'active'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Active Lists ({activeLists.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'completed'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Completed ({completedLists.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === 'archived'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Archived ({archivedLists.length})
            </button>
          </div>

          {/* Lists Grid */}
          {(() => {
            const currentTabLists = activeTab === 'active'
              ? activeLists
              : activeTab === 'completed'
              ? completedLists
              : archivedLists;

            if (currentTabLists.length === 0) {
              return (
                <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeTab === 'active'
                      ? 'No active shopping lists'
                      : activeTab === 'completed'
                      ? 'No completed shopping lists'
                      : 'No archived shopping lists'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    {activeTab === 'active'
                      ? 'Create a list for weekly groceries, kitchen staples, or bazaar runs in Kathmandu and beyond.'
                      : 'Completed and archived lists will be preserved here.'}
                  </p>
                  {activeTab === 'active' && (
                    <button
                      onClick={() => setIsCreateListOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white finance-gradient-action hover:opacity-95 transition shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Shopping List</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentTabLists.map(list => {
                  const summary = getListSummary(list.id);
                  return (
                    <div
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 rounded-3xl p-5 shadow-sm hover:shadow-md transition space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {list.title}
                          </h3>
                          {list.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {list.description}
                            </p>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {summary.purchasedItemsCount} of {summary.totalItems} items bought
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {summary.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full finance-gradient-action rounded-full transition-all"
                            style={{ width: `${summary.progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Financial Totals */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div>
                          <p className="text-[11px] text-slate-400">Estimated Total</p>
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            {formatNPR(summary.estimatedTotal)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Actual Spent</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300">
                            {formatNPR(summary.actualPurchasedTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODALS
         ───────────────────────────────────────────────────────────── */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onSubmit={async (title, desc) => {
          const created = await createList(title, desc);
          setSelectedListId(created.id);
        }}
      />

      <EditListModal
        isOpen={Boolean(editingList)}
        list={editingList}
        onClose={() => setEditingList(null)}
        onSubmit={(id, updates) => updateList(id, updates)}
      />

      <DeleteListModal
        isOpen={Boolean(deletingList)}
        list={deletingList}
        purchasedCount={deletingList ? getListSummary(deletingList.id).purchasedItemsCount : 0}
        totalSpent={deletingList ? getListSummary(deletingList.id).actualPurchasedTotal : 0}
        onClose={() => setDeletingList(null)}
        onConfirm={async (id, deleteTransactions) => {
          await deleteList(id, deleteTransactions);
          if (selectedListId === id) setSelectedListId(null);
        }}
      />

      {selectedListId && (
        <AddItemModal
          isOpen={isAddItemOpen}
          listId={selectedListId}
          categories={categories}
          onClose={() => setIsAddItemOpen(false)}
          onSubmit={item => addItem(selectedListId, item)}
        />
      )}

      <EditItemModal
        isOpen={Boolean(editingItem)}
        item={editingItem}
        categories={categories}
        onClose={() => setEditingItem(null)}
        onSubmit={editItem}
      />

      <MarkPurchasedModal
        isOpen={Boolean(purchasingItem)}
        item={purchasingItem}
        categories={categories}
        onClose={() => setPurchasingItem(null)}
        onConfirm={handleConfirmPurchase}
      />

      <UndoPurchaseModal
        isOpen={Boolean(undoingItem)}
        item={undoingItem}
        onClose={() => setUndoingItem(null)}
        onConfirm={undoPurchase}
      />
    </div>
  );
};
export default ShoppingPage;
