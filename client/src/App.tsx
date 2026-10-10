import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SyncProvider } from './context/SyncContext.js';
import { TransactionProvider, useTransactions } from './context/TransactionContext.js';
import { FriendMoneyProvider } from './context/FriendMoneyContext.js';
import { ShoppingProvider } from './context/ShoppingContext.js';
import { Sidebar } from './components/Sidebar.js';
import { TopHeader } from './components/TopHeader.js';
import { MobileNav } from './components/MobileNav.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { AddPage } from './pages/AddPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { FriendMoneyPage } from './pages/FriendMoneyPage.js';
import { ShoppingPage } from './pages/ShoppingPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { EditModal } from './components/EditModal.js';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.js';
import { StartingBalanceModal } from './components/StartingBalanceModal.js';
import { AddCustomCategoryModal } from './components/AddCustomCategoryModal.js';
import { ChangePasswordModal } from './components/ChangePasswordModal.js';
import { ResetPasswordModal } from './components/ResetPasswordModal.js';
import { Preloader } from './components/Preloader.js';
import { AuthModal } from './pages/AuthPage.js';
import { Transaction, TransactionType } from './types/index.js';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [addType, setAddType] = useState<TransactionType>('expense');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-white dark:bg-[#050816] text-slate-900 dark:text-slate-100 flex selection:bg-blue-600 selection:text-white">
      {/* Animated HISAB Preloader */}
      <Preloader />

      {/* Desktop Sidebar (hidden on mobile, fixed on desktop) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={tab => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          onOpenStartingBalance={() => setIsStartingBalanceOpen(true)}
          onOpenAddCategory={() => setIsAddCategoryOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenAuthModal={() => setIsAuthOpen(true)}
        />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 h-full">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={tab => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
              onOpenStartingBalance={() => {
                setIsStartingBalanceOpen(true);
                setMobileMenuOpen(false);
              }}
              onOpenAddCategory={() => {
                setIsAddCategoryOpen(true);
                setMobileMenuOpen(false);
              }}
              onOpenSettings={() => {
                setActiveTab('settings');
                setMobileMenuOpen(false);
              }}
              onOpenAuthModal={() => {
                setIsAuthOpen(true);
                setMobileMenuOpen(false);
              }}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Bar */}
        <TopHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenAuthModal={() => setIsAuthOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToHistory={() => setActiveTab('history')}
              onEditTransaction={tx => setEditingTransaction(tx)}
              onDeleteTransaction={tx => setDeletingTransaction(tx)}
              onOpenStartingBalance={() => setIsStartingBalanceOpen(true)}
              onNavigateToAdd={(type = 'expense') => {
                setAddType(type);
                setActiveTab('add');
              }}
              onNavigateToFriends={() => setActiveTab('friends')}
              onNavigateToShopping={() => setActiveTab('shopping')}
            />
          )}

          {activeTab === 'add' && (
            <AddPage onTransactionSaved={() => setActiveTab('dashboard')} initialType={addType} />
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

          {activeTab === 'shopping' && (
            <ShoppingPage onNavigateToHistory={() => setActiveTab('history')} />
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

        {/* Mobile Bottom Navigation (Visible on mobile/tablet) */}
        <div className="lg:hidden">
          <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>

      {/* Reusable Modals */}
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
            <ShoppingProvider>
              <MainLayout />
            </ShoppingProvider>
          </FriendMoneyProvider>
        </TransactionProvider>
      </SyncProvider>
    </AuthProvider>
  );
}

export default App;
