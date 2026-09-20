import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';

// Safe runtime fallback for local / Render hosting
const getDb = () => {
  if (globalThis.__B44_DB__) return globalThis.__B44_DB__;
  return {
    auth: {
      isAuthenticated: async () => !!localStorage.getItem('mock_user'),
      me: async () => JSON.parse(localStorage.getItem('mock_user')) || null,
      updateMe: async (data) => data,
      logout: () => {
        localStorage.removeItem('mock_user');
        window.location.href = '/login';
      },
      redirectToLogin: () => {
        window.location.href = '/login';
      }
    }
  };
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);
      // Always check user auth from localStorage / db.auth.me()
      await checkUserAuth();
    } catch (error) {
      console.error('App initialization error:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const db = getDb();

    try {
      // 1. Try reading user from localStorage first
      let currentUser = null;
      const stored = localStorage.getItem('mock_user');
      if (stored) {
        try {
          currentUser = JSON.parse(stored);
        } catch (e) {
          currentUser = null;
        }
      }

      // 2. Fallback to db.auth.me() if localStorage isn't set yet
      if (!currentUser && db.auth?.me) {
        currentUser = await db.auth.me();
      }

      if (currentUser) {
        // Auto-promote @staffwaitrose.net accounts to owner status
        const isStaffWaitrose = currentUser?.email?.endsWith('@staffwaitrose.net');
        if (isStaffWaitrose) {
          currentUser.role = 'admin';
          currentUser.is_owner = true;
        }

        // Persist back to local state and storage
        localStorage.setItem('mock_user', JSON.stringify(currentUser));
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('mock_user');
    setUser(null);
    setIsAuthenticated(false);
    
    const db = getDb();
    if (db.auth?.logout) {
      db.auth.logout();
    } else if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
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