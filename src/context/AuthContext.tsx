import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, signOut, SUPER_ADMIN_EMAIL, handleFirestoreError, OperationType, sanitizePayload } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = useMemo(() => {
    if (!currentUser || !currentUser.email) return false;
    return currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  }, [currentUser]);

  const fetchProfile = async (user: User) => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
      } else {
        // Create initial profile
        const initialProfile: UserProfile = {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Auditee',
          role: user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
          jobRole: '',
          department: '',
          jobDescription: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const clean = sanitizePayload(initialProfile);
        await setDoc(userDocRef, clean);
        setUserProfile(clean);

        // If super admin, record in admins collection for RBAC lookup
        if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
          const adminDocRef = doc(db, 'admins', user.uid);
          await setDoc(adminDocRef, sanitizePayload({
            email: user.email,
            role: 'superadmin',
            assignedAt: new Date().toISOString(),
          }));
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching or creating profile:', err);
      try {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } catch (e: any) {
        setError(e.message);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setError(null);
      if (user) {
        setCurrentUser(user);
        await fetchProfile(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchProfile(result.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setError(err?.message || 'Failed to authenticate with Google.');
      throw err;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Sign-out failed:', err);
      setError(err?.message || 'Failed to sign out.');
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Not authenticated');
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const updateData = sanitizePayload({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(userDocRef, updateData);
      setUserProfile((prev) => (prev ? { ...prev, ...updateData } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isSuperAdmin,
        loading,
        error,
        signInWithGoogle,
        signOutUser,
        updateUserProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
