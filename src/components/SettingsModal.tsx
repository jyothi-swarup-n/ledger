import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  User as UserIcon,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  AlertTriangle,
  Lock,
  Building2,
  Briefcase,
  CheckCircle2,
  ArrowLeft,
  Cloud,
  RefreshCw,
  Layers,
  ChevronRight,
  Sparkles,
  Smartphone,
  Download
} from 'lucide-react';
import { CategoryScope } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const {
    currentUser,
    usersList,
    logoutUser,
    updateUserProfile,
    deleteUserAccount,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    googleAccount,
    connectGoogleAccount,
    disconnectGoogleAccount,
    triggerGoogleBackup,
    isGoogleBackingUp,
    lastGoogleBackup,
    profileAliases,
    updateProfileAlias,
    addProfileScope,
    loadDemoData,
    resetUserData
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'google' | 'users'>('profile');
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [pwdInput, setPwdInput] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Category filter: strictly Work, Personal, or All
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Work' | 'Personal'>('All');
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<CategoryScope>('Work');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Subcategory addition in category
  const [activeSubcatCatId, setActiveSubcatCatId] = useState<string | null>(null);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [newSubcatBudget, setNewSubcatBudget] = useState('');

  // Profile alias editing
  const [editingProfileKey, setEditingProfileKey] = useState<string | null>(null);
  const [profileNameInput, setProfileNameInput] = useState('');
  const [isAddingNewProfile, setIsAddingNewProfile] = useState(false);
  const [newProfileKey, setNewProfileKey] = useState('');
  const [newProfileName, setNewProfileName] = useState('');

  // Google account input
  const [googleEmailInput, setGoogleEmailInput] = useState(currentUser?.email || '');

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(nameInput, pwdInput || undefined);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      subcategories: []
    });
    setNewCatName('');
    setIsAddingCat(false);
  };

  const handleAddSubcat = (categoryId: string) => {
    if (!newSubcatName.trim()) return;
    const numBudget = parseFloat(newSubcatBudget) || 0;
    addSubcategory(categoryId, {
      name: newSubcatName.trim(),
      individualBudget: numBudget
    });
    setNewSubcatName('');
    setNewSubcatBudget('');
    setActiveSubcatCatId(null);
  };

  const handleSaveProfileAlias = (key: string) => {
    if (profileNameInput.trim()) {
      updateProfileAlias(key, profileNameInput.trim());
    }
    setEditingProfileKey(null);
    setProfileNameInput('');
  };

  const handleAddNewProfileScope = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileKey.trim() && newProfileName.trim()) {
      addProfileScope(newProfileKey.trim(), newProfileName.trim());
      setNewProfileKey('');
      setNewProfileName('');
      setIsAddingNewProfile(false);
    }
  };

  // Filter categories for the category page
  const filteredCategories = categories.filter((c) => {
    if (categoryFilter === 'All') return true;
    if (categoryFilter === 'Work') return c.type === 'Work' || c.type === 'Both';
    if (categoryFilter === 'Personal') return c.type === 'Personal' || c.type === 'Both';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0e14] text-[#e1e2eb] flex flex-col overflow-y-auto animate-in fade-in duration-150">
      {/* 1. Full-Screen Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0b0e14]/95 backdrop-blur-xl border-b border-[#2a334a] p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141824] border border-[#2a334a] text-zinc-300 hover:text-white hover:border-[#c3f400] text-xs font-bold transition-all shadow-brutal-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#c3f400]" />
          <span>Back to Ledger</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#c3f400]">
            ACCOUNT PROFILE
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {currentUser?.name || 'Jyothi'} • ARSONIST
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-[#141824] border border-[#2a334a] text-zinc-400 hover:text-white flex items-center justify-center text-sm font-bold active:scale-95"
          title="Close Full Screen View"
        >
          ✕
        </button>
      </header>

      {/* 2. Top Segmented Navigation */}
      <div className="max-w-lg w-full mx-auto px-4 pt-4">
        <div className="flex bg-[#141824] p-1 rounded-xl border-2 border-[#2a334a] overflow-x-auto no-scrollbar shadow-brutal">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[90px] py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 min-w-[100px] py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`flex-1 min-w-[120px] py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-[80px] py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Logins</span>
          </button>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <main className="max-w-lg w-full mx-auto px-4 py-4 flex-1 space-y-4">
        {/* ========================================================================= */}
        {/* TAB 1: PROFILE & SCOPES                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* PWA Phone / Desktop Install Banner */}
            <div className="bg-[#141824] border-2 border-[#c3f400] rounded-xl p-4 shadow-brutal-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0b0e14] border border-[#c3f400] flex items-center justify-center text-[#c3f400]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block uppercase tracking-wider">
                      Mobile & Desktop Installation
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Install Kinetic Ledger to your phone's home screen
                    </span>
                  </div>
                </div>
              </div>
              <PWAInstallButton variant="full" />

              <div className="pt-2 border-t border-[#2a334a] flex flex-col gap-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Direct Offline Phone Files:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="/kinetic-ledger-offline.html"
                    download="kinetic-ledger.html"
                    className="py-2 px-2.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#c3f400] text-zinc-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-brutal-sm transition-colors text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-[#c3f400] shrink-0" />
                    <span>Offline HTML</span>
                  </a>
                  <a
                    href="/kinetic-ledger-phone-package.zip"
                    download="kinetic-ledger-phone-package.zip"
                    className="py-2 px-2.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#3872ff] text-zinc-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-brutal-sm transition-colors text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-[#3872ff] shrink-0" />
                    <span>Complete ZIP</span>
                  </a>
                </div>
                <span className="text-[10px] text-zinc-500 italic">
                  Save the HTML file to your phone's storage to open it in Chrome completely offline without any internet connection.
                </span>
              </div>
            </div>

            {/* User Identity Card */}
            <div className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#c3f400] text-[#0b0e14] font-bold text-xl flex items-center justify-center shadow-brutal-sm">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'J'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{currentUser?.name || 'Jyothi'}</h2>
                  <span className="text-xs text-zinc-400 font-mono">{currentUser?.email}</span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 pt-2 border-t border-[#2a334a]">
                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Jyothi"
                    className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#c3f400]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                    Security Password / PIN
                  </label>
                  <input
                    type="password"
                    value={pwdInput}
                    onChange={(e) => setPwdInput(e.target.value)}
                    placeholder="Enter new password to update..."
                    className="w-full bg-[#0b0e14] border border-[#2a334a] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-lg bg-[#c3f400] text-[#0b0e14] text-xs font-bold shadow-brutal-sm hover:brightness-105 active:scale-95 transition-all"
                  >
                    Save Changes
                  </button>
                  {profileSaved && (
                    <span className="text-xs text-[#c3f400] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Profile Scope Editor (Work, Personal, Custom) */}
            <div className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#c3f400]" />
                    <span>Profile Scopes (Work / Personal)</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Rename profiles or add custom transaction scopes.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingNewProfile(true)}
                  className="px-2 py-1 rounded bg-[#0b0e14] border border-[#2a334a] hover:border-[#c3f400] text-[11px] font-bold text-white flex items-center gap-1 shadow-brutal-sm"
                >
                  <Plus className="w-3 h-3 text-[#c3f400]" />
                  <span>Add Scope</span>
                </button>
              </div>

              {/* Add New Profile Scope Form */}
              {isAddingNewProfile && (
                <form onSubmit={handleAddNewProfileScope} className="p-3 bg-[#0b0e14] border border-[#2a334a] rounded-xl space-y-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      Scope Identifier (e.g. Venture, Investments)
                    </label>
                    <input
                      type="text"
                      required
                      value={newProfileKey}
                      onChange={(e) => setNewProfileKey(e.target.value)}
                      placeholder="e.g. Investments"
                      className="w-full bg-[#141824] border border-[#2a334a] rounded py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      required
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="e.g. Angel & Equity Portfolio"
                      className="w-full bg-[#141824] border border-[#2a334a] rounded py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewProfile(false)}
                      className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#c3f400] text-[#0b0e14] text-xs font-bold rounded"
                    >
                      Save Scope
                    </button>
                  </div>
                </form>
              )}

              {/* Scope List with Rename Functionality */}
              <div className="space-y-2">
                {Object.entries(profileAliases).map(([key, name]) => {
                  const isEditing = editingProfileKey === key;
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              key === 'Work'
                                ? 'bg-[#1f2638] text-[#3872ff]'
                                : key === 'Personal'
                                ? 'bg-[#291419] text-[#c3f400]'
                                : 'bg-[#291e12] text-[#ffb703]'
                            }`}
                          >
                            {key}
                          </span>
                          {!isEditing && (
                            <span className="text-xs font-bold text-white">{name}</span>
                          )}
                        </div>

                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingProfileKey(key);
                              setProfileNameInput(name);
                            }}
                            className="text-[11px] text-[#c3f400] hover:underline flex items-center gap-1 font-bold"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Rename</span>
                          </button>
                        )}
                      </div>

                      {isEditing && (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={profileNameInput}
                            onChange={(e) => setProfileNameInput(e.target.value)}
                            className="flex-1 bg-[#141824] border border-[#c3f400] rounded px-2 py-1 text-xs text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveProfileAlias(key)}
                            className="px-2.5 py-1 bg-[#c3f400] text-[#0b0e14] text-xs font-bold rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProfileKey(null)}
                            className="px-2 py-1 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CATEGORIES (With Work / Personal Toggle as requested)              */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-[#c3f400]" />
                    <span>Category Architecture</span>
                  </h3>
                  <span className="text-[11px] text-zinc-400">
                    Switch between Work and Personal to organize budgets & ledgers.
                  </span>
                </div>

                <button
                  onClick={() => setIsAddingCat(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#c3f400] text-xs font-bold text-white flex items-center gap-1 shadow-brutal-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-[#c3f400]" />
                  <span>New Category</span>
                </button>
              </div>

              {/* Work / Personal Toggle Buttons as requested */}
              <div className="grid grid-cols-3 gap-1 bg-[#0b0e14] p-1 rounded-xl border border-[#2a334a]">
                {(['All', 'Work', 'Personal'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCategoryFilter(filter)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      categoryFilter === filter
                        ? 'bg-[#c3f400] text-[#0b0e14] shadow-brutal-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {filter === 'All' ? 'All (Both)' : filter}
                  </button>
                ))}
              </div>

              {/* Add New Category Form */}
              {isAddingCat && (
                <form onSubmit={handleAddCategory} className="p-3 rounded-xl bg-[#0b0e14] border border-[#2a334a] space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Legal & Compliance, SaaS, Travel"
                      className="w-full bg-[#141824] border border-[#2a334a] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">
                      Scope (Work / Personal / Both)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['Work', 'Personal', 'Both'] as const).map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => setNewCatType(sc)}
                          className={`py-1.5 text-xs font-bold rounded border ${
                            newCatType === sc
                              ? 'bg-[#c3f400] text-[#0b0e14] border-[#c3f400]'
                              : 'bg-[#141824] text-zinc-400 border-[#2a334a]'
                          }`}
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#c3f400] text-[#0b0e14] text-xs font-bold rounded-lg shadow-brutal-sm"
                    >
                      Create Category
                    </button>
                  </div>
                </form>
              )}

              {/* Filtered Categories List */}
              <div className="space-y-2.5 pt-1">
                {filteredCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-[#0b0e14] border border-[#2a334a] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs sm:text-sm">{cat.name}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            cat.type === 'Work'
                              ? 'bg-[#1f2638] text-[#3872ff]'
                              : cat.type === 'Personal'
                              ? 'bg-[#291419] text-[#c3f400]'
                              : 'bg-[#142b1e] text-[#c3f400]'
                          }`}
                        >
                          {cat.type}
                        </span>
                        {cat.isTransfer && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#3872ff]/20 text-[#3872ff] font-bold">
                            Transfer
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setActiveSubcatCatId(activeSubcatCatId === cat.id ? null : cat.id)
                          }
                          className="text-[10px] text-zinc-400 hover:text-[#c3f400] font-bold uppercase"
                        >
                          + Subcategory
                        </button>
                        {!cat.isTransfer && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                deleteCategory(cat.id);
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-[#ff4d6d]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subcategories */}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="pl-3 border-l-2 border-[#2a334a] space-y-1">
                        {cat.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between text-xs py-0.5 text-zinc-300"
                          >
                            <span>↳ {sub.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-zinc-400">
                                Cap: ₹{sub.individualBudget.toLocaleString('en-IN')}
                              </span>
                              <button
                                onClick={() => deleteSubcategory(cat.id, sub.id)}
                                className="text-zinc-600 hover:text-[#ff4d6d]"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Subcategory Form */}
                    {activeSubcatCatId === cat.id && (
                      <div className="pt-2 border-t border-[#2a334a]/60 flex items-center gap-2">
                        <input
                          type="text"
                          value={newSubcatName}
                          onChange={(e) => setNewSubcatName(e.target.value)}
                          placeholder="Subcategory name"
                          className="flex-1 bg-[#141824] border border-[#2a334a] rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="number"
                          value={newSubcatBudget}
                          onChange={(e) => setNewSubcatBudget(e.target.value)}
                          placeholder="Budget ₹"
                          className="w-24 bg-[#141824] border border-[#2a334a] rounded px-2 py-1 text-xs font-mono text-white"
                        />
                        <button
                          onClick={() => handleAddSubcat(cat.id)}
                          className="px-2.5 py-1 bg-[#c3f400] text-[#0b0e14] text-xs font-bold rounded"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GOOGLE ACCOUNT & CLOUD BACKUP (Replaces VPS sync)                  */}
        {/* ========================================================================= */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0b0e14] border border-[#2a334a] flex items-center justify-center text-[#c3f400]">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                    Google Account Cloud Backup
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Log in and back up ledger data directly to your connected Google Account
                  </span>
                </div>
              </div>

              {googleAccount ? (
                <div className="bg-[#0b0e14] border-2 border-[#c3f400] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#c3f400] animate-pulse" />
                      <span className="text-xs font-bold text-white">Google Account Linked</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#142b1e] text-[#c3f400] font-bold uppercase border border-[#c3f400]/40">
                      Sync Active
                    </span>
                  </div>

                  <div className="p-3 bg-[#141824] rounded-lg border border-[#2a334a] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{googleAccount.name}</span>
                      <span className="text-[11px] font-mono text-zinc-400">{googleAccount.email}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Last: {lastGoogleBackup || 'Just now'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={triggerGoogleBackup}
                      disabled={isGoogleBackingUp}
                      className="flex-1 py-2.5 rounded-lg bg-[#c3f400] text-[#0b0e14] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-brutal-sm hover:brightness-105 active:scale-95 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGoogleBackingUp ? 'animate-spin' : ''}`} />
                      <span>{isGoogleBackingUp ? 'Transmitting Encrypted Ledger...' : 'Back up Now to Cloud'}</span>
                    </button>

                    <button
                      onClick={disconnectGoogleAccount}
                      className="px-3 py-2.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#ff4d6d] text-zinc-400 hover:text-[#ff4d6d] text-xs font-bold"
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0b0e14] border border-[#2a334a] p-4 rounded-xl space-y-3">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Connect your Google Account to automatically protect your transaction history, account ledgers, and budget allocations.
                  </p>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-zinc-400 block">
                      Google Account Email
                    </label>
                    <input
                      type="email"
                      value={googleEmailInput}
                      onChange={(e) => setGoogleEmailInput(e.target.value)}
                      placeholder="jyothi@arsonist.group or jyothi@gmail.com"
                      className="w-full bg-[#141824] border border-[#2a334a] rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-[#c3f400]"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!googleEmailInput.trim()) return;
                      connectGoogleAccount(googleEmailInput.trim(), currentUser?.name);
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#c3f400] text-[#0b0e14] font-bold text-xs uppercase tracking-wider shadow-brutal-sm hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Connect Google Account for Cloud Backup</span>
                  </button>
                </div>
              )}

              <div className="p-3 bg-[#0b0e14] rounded-lg border border-[#2a334a] text-xs text-zinc-400">
                <span className="font-bold text-zinc-200 block mb-0.5">Automated Cloud Backups:</span>
                <span>
                  Ledger states are encrypted with AES-256 before synchronization. Once linked, any changes you make in Book.xlsx views are mirrored to your central backup.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: USERS & LOGINS                                                     */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-[#141824] border-2 border-[#2a334a] rounded-xl p-4 shadow-brutal-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase text-white tracking-wider">
                    Authorized User Accounts ({usersList.length})
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Switch between team members or sign in to an existing ledger.
                  </span>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3872ff] text-white text-xs font-bold uppercase shadow-brutal-sm hover:brightness-105"
                >
                  + Add / Log In
                </button>
              </div>

              {/* User Accounts List */}
              <div className="space-y-2">
                {usersList.map((u) => {
                  const isActive = currentUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isActive
                          ? 'bg-[#1f2638] border-[#c3f400]'
                          : 'bg-[#0b0e14] border-[#2a334a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#141824] text-[#c3f400] font-bold text-xs flex items-center justify-center border border-[#2a334a]">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{u.name}</span>
                          <span className="text-[10px] font-mono text-zinc-400">{u.email}</span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#c3f400] text-[#0b0e14] font-mono">
                          ACTIVE SESSION
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            localStorage.setItem('kinetic_ledger_active_user_id', u.id);
                            window.location.reload();
                          }}
                          className="px-3 py-1 rounded bg-[#141824] text-xs font-bold text-white border border-[#2a334a] hover:border-[#c3f400]"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Log Out Button */}
              <button
                onClick={() => {
                  logoutUser();
                  onClose();
                  onOpenAuth();
                }}
                className="w-full py-2.5 mt-2 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#ff4d6d] text-xs font-bold text-zinc-300 hover:text-[#ff4d6d] flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Current Session</span>
              </button>
            </div>

            {/* Ledger Reset & Demo Tools */}
            <div className="p-4 bg-[#141824] border-2 border-[#2a334a] rounded-xl space-y-2.5 shadow-brutal-sm">
              <span className="text-xs font-bold text-white uppercase block">
                Ledger Data Utilities
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Clear all bank accounts, cards, and transactions to start fresh from scratch, or load sample data to explore.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset your ledger to an empty clean slate?')) {
                      resetUserData();
                      onClose();
                    }
                  }}
                  className="py-2 px-2.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#ff4d6d] text-zinc-200 hover:text-[#ff4d6d] text-[11px] font-bold text-center transition-colors"
                >
                  Reset to Clean Slate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loadDemoData();
                    onClose();
                  }}
                  className="py-2 px-2.5 rounded-lg bg-[#0b0e14] border border-[#2a334a] hover:border-[#c3f400] text-zinc-200 hover:text-[#c3f400] text-[11px] font-bold text-center transition-colors"
                >
                  Load Sample Dataset
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-4 bg-[#1a1215] border border-[#ff4d6d]/40 rounded-xl space-y-2">
              <span className="text-xs font-bold text-[#ff4d6d] uppercase block">
                Danger Zone: Erase Data
              </span>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Permanently deletes the active user account and erases all associated financial ledgers from this browser device.
              </p>
              <button
                onClick={() => {
                  if (
                    confirm(
                      'WARNING: Are you sure you want to delete this account? All associated ledger data, budgets, and transactions for this user will be permanently erased.'
                    )
                  ) {
                    deleteUserAccount();
                    onClose();
                    onOpenAuth();
                  }
                }}
                className="py-1.5 px-3 rounded bg-[#ff4d6d] text-white text-xs font-bold uppercase hover:brightness-110"
              >
                Delete Account & Erase Ledger
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
