import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SyncProvider } from './context/SyncContext.js';
import { TransactionProvider, useTransactions } from './context/TransactionContext.js';
import { FriendMoneyProvider } from './context/FriendMoneyContext.js';
import { Navbar } from './components/Navbar.js';
import { MobileNav } from './components/MobileNav.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AddPage } from './pages/AddPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { FriendMoneyPage } from './pages/FriendMoneyPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { EditModal } from './components/EditModal.js';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.js';
import { StartingBalanceModal } from './components/StartingBalanceModal.js';
import { AddCustomCategoryModal } from './components/AddCustomCategoryModal.js';
import { ChangePasswordModal } from './components/ChangePasswordModal.js';
import { ResetPasswordModal } from './components/ResetPasswordModal.js';
import { AuthModal } from './pages/AuthPage.js';
import { Transaction } from './types/index.js';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const { isPasswordRecovery, setIsPasswordRecovery } = useAuth();

  // Modal States
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isStartingBalanceOpen, setIsStartingBalanceOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const { categories, editTransaction, deleteTransaction, addCustomCategory } = useTransactions();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToHistory={() => setActiveTab('history')}
            onEditTransaction={tx => setEditingTransaction(tx)}
            onDeleteTransaction={tx => setDeletingTransaction(tx)}
            onOpenStartingBalance={() => setIsStartingBalanceOpen(true)}
          />
        )}

        {activeTab === 'add' && (
          <AddPage onTransactionSaved={() => setActiveTab('dashboard')} />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            onEditTransaction={tx => setEditingTransaction(tx)}
            onDeleteTransaction={tx => setDeletingTransaction(tx)}
            onNavigateToAdd={() => setActiveTab('add')}
          />
        )}

        {activeTab === 'friends' && (
          <FriendMoneyPage />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            onOpenStartingBalance={() => setIsStartingBalanceOpen(true)}
            onOpenAddCategory={() => setIsAddCategoryOpen(true)}
            onOpenAuthModal={() => setIsAuthOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <EditModal
        isOpen={Boolean(editingTransaction)}
        transaction={editingTransaction}
        categories={categories}
        onClose={() => setEditingTransaction(null)}
        onSave={editTransaction}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingTransaction)}
        transaction={deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirmDelete={deleteTransaction}
      />

      <StartingBalanceModal
        isOpen={isStartingBalanceOpen}
        onClose={() => setIsStartingBalanceOpen(false)}
      />

      <AddCustomCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAddCategory={addCustomCategory}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <ResetPasswordModal
        isOpen={isPasswordRecovery}
        onClose={() => setIsPasswordRecovery(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <TransactionProvider>
          <FriendMoneyProvider>
            <MainLayout />
          </FriendMoneyProvider>
        </TransactionProvider>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
