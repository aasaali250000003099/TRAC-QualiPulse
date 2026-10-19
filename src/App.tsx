/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ProfileEditor } from './components/ProfileEditor';
import { AuditConsole } from './components/AuditConsole';
import { AuditHistory } from './components/AuditHistory';
import { AdminPortal } from './components/AdminPortal';
import { StandardsModal } from './components/StandardsModal';
import { CompanyStandard, AuditInteraction } from './types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { RefreshCw, ShieldCheck } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isSuperAdmin, loading, userProfile } = useAuth();

  const [currentTab, setCurrentTab] = useState<'audit' | 'history' | 'profile' | 'admin'>('audit');
  const [standards, setStandards] = useState<CompanyStandard[]>([]);
  const [userInteractions, setUserInteractions] = useState<AuditInteraction[]>([]);
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState(false);
  const [standardsLoading, setStandardsLoading] = useState(false);

  // Fetch company standards when authenticated
  useEffect(() => {
    if (!currentUser) {
      setStandards([]);
      return;
    }

    setStandardsLoading(true);
    const standardsCol = collection(db, 'company_standards');
    const unsubStandards = onSnapshot(
      standardsCol,
      (snapshot) => {
        const stds: CompanyStandard[] = [];
        snapshot.forEach((doc) => {
          stds.push(doc.data() as CompanyStandard);
        });
        setStandards(stds);
        setStandardsLoading(false);
      },
      (error) => {
        console.error('Error fetching company standards:', error);
        handleFirestoreError(error, OperationType.GET, 'company_standards');
        setStandardsLoading(false);
      }
    );

    return () => unsubStandards();
  }, [currentUser]);

  // Fetch user-isolated interactions
  useEffect(() => {
    if (!currentUser) {
      setUserInteractions([]);
      return;
    }

    const interactionsCol = collection(db, 'users', currentUser.uid, 'interactions');
    const unsubInteractions = onSnapshot(
      interactionsCol,
      (snapshot) => {
        const items: AuditInteraction[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as AuditInteraction);
        });
        // Sort newest first
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUserInteractions(items);
      },
      (error) => {
        console.error('Error fetching user interactions:', error);
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/interactions`);
      }
    );

    return () => unsubInteractions();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col items-center justify-center text-emerald-950 space-y-4 px-4">
        <div className="relative">
          <div className="absolute -inset-2 bg-emerald-200/50 rounded-full blur-md animate-pulse" />
          <img
            src="/trac-logo-512.png"
            alt="Tawi-Tawi Regional Agricultural College Seal"
            className="w-24 h-24 object-contain relative z-10 drop-shadow-md rounded-full bg-white p-1 border-2 border-emerald-400"
          />
        </div>
        <div className="flex items-center space-x-2 text-emerald-800">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-xs font-bold tracking-wider uppercase">
            Initializing TRAC Secure Session...
          </span>
        </div>
        <p className="text-[11px] text-emerald-700/80 font-medium text-center max-w-xs">
          Tawi-Tawi Regional Agricultural College &bull; Quality Assurance Management Office
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-white/80 to-green-50/80 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenStandards={() => setIsStandardsModalOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1">
        {!currentUser ? (
          <LandingPage />
        ) : (
          <main className="animate-fade-in pb-12">
            {currentTab === 'audit' && (
              <AuditConsole
                standards={standards}
                recentInteractions={userInteractions}
                onInteractionSaved={(newInteraction) => {
                  setUserInteractions((prev) => [newInteraction, ...prev.filter((p) => p.id !== newInteraction.id)]);
                }}
                onNavigateToProfile={() => setCurrentTab('profile')}
                onOpenStandards={() => setIsStandardsModalOpen(true)}
              />
            )}

            {currentTab === 'history' && (
              <AuditHistory
                interactions={userInteractions}
                onInteractionDeleted={(id) => {
                  setUserInteractions((prev) => prev.filter((item) => item.id !== id));
                }}
                onStartAudit={() => setCurrentTab('audit')}
              />
            )}

            {currentTab === 'profile' && <ProfileEditor />}

            {currentTab === 'admin' && (
              <AdminPortal
                standards={standards}
                onStandardsUpdated={() => {
                  // onSnapshot will automatically update standards state
                }}
              />
            )}
          </main>
        )}
      </div>

      {/* Standards Reference Modal */}
      <StandardsModal
        isOpen={isStandardsModalOpen}
        onClose={() => setIsStandardsModalOpen(false)}
        standards={standards}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
