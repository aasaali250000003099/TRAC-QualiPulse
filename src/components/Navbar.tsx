import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, LogOut, LogIn, User, BookOpen, LayoutDashboard, Database } from 'lucide-react';

interface NavbarProps {
  currentTab: 'audit' | 'history' | 'profile' | 'admin';
  setCurrentTab: (tab: 'audit' | 'history' | 'profile' | 'admin') => void;
  onOpenStandards: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenStandards }) => {
  const { currentUser, userProfile, isSuperAdmin, signInWithGoogle, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('audit')}>
          <div className="relative">
            <img
              src="/trac-logo-128.png"
              alt="Tawi-Tawi Regional Agricultural College Seal"
              className="w-11 h-11 object-contain drop-shadow-sm rounded-full bg-white p-0.5 border border-emerald-300 ring-2 ring-emerald-500/20"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-emerald-900 via-green-800 to-emerald-700 bg-clip-text text-transparent">
                TRAC QualiPulse
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full">
                TRAC QA
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 font-medium hidden sm:block">
              Tawi-Tawi Regional Agricultural College &bull; Quality Assurance Audit OS
            </p>
          </div>
        </div>

        {/* Navigation Tabs (when logged in) */}
        {currentUser && (
          <nav className="flex items-center space-x-1 sm:space-x-1.5 bg-emerald-50/70 p-1 rounded-xl border border-emerald-100/80">
            <button
              onClick={() => setCurrentTab('audit')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'audit'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audit Session</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'history'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
              <span>My History</span>
            </button>

            <button
              onClick={() => setCurrentTab('profile')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'profile'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Role Profile</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  currentTab === 'admin'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-sm'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-600" />
                <span>Super Admin</span>
              </button>
            )}
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenStandards}
            title="View Official Institutional Quality Standards"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Quality Standards</span>
          </button>

          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end space-x-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {userProfile?.displayName || currentUser.displayName || 'Auditee'}
                  </span>
                  {isSuperAdmin && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 rounded">
                      SUPER ADMIN
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                  {currentUser.email}
                </span>
              </div>

              <button
                onClick={signOutUser}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center space-x-2 px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
