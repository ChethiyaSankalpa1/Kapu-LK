import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { authAPI, userAPI, premiumAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });
  const [premiumStatus, setPremiumStatus] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authAPI.getMe();
      setUser(me.data);
      localStorage.setItem('user', JSON.stringify(me.data));

      if (me.data.language) {
        setLanguageState(me.data.language);
      }

      return me.data;
    } catch (err) {
      console.error('Failed to refresh user', err);
      return null;
    }
  }, []);

  // Apply dark mode to body
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply language
  useEffect(() => {
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Fetch user and premium status
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const me = await refreshUser();
        if (me && (me.emailVerified || me.role === 'admin')) {
          try {
            const statusRes = await premiumAPI.getStatus();
            setPremiumStatus(statusRes.data);
          } catch (err) {
            console.error('Failed to fetch premium status', err);
          }
        } else if (!me) {
          // fallback to cached user
          const cached = localStorage.getItem('user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch (parseErr) {
              console.warn('Corrupt user cached in localStorage, clearing', parseErr);
              localStorage.removeItem('user');
            }
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (loginPayload, token) => {
    localStorage.setItem('token', token);
    const me = await refreshUser();
    if (me) {
      if (me.emailVerified || me.role === 'admin') {
        try {
          const statusRes = await premiumAPI.getStatus();
          setPremiumStatus(statusRes.data);
        } catch (err) {
          console.error('Failed to fetch premium status', err);
        }
      }
    } else {
      setUser(loginPayload);
      localStorage.setItem('user', JSON.stringify(loginPayload));
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (_e) {
      // swallow network/server errors so logout never hangs the UI
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPremiumStatus(null);
  };

  const updateUser = (updatedUser) => {
    setUser((prevUser) => {
      const mergedUser = { ...(prevUser || {}), ...(updatedUser || {}) };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      if (mergedUser.language) {
        setLanguageState(mergedUser.language);
      }
      return mergedUser;
    });
  };

  const setLanguage = async (lang) => {
    setLanguageState(lang);

    if (user) {
      try {
        await userAPI.updateProfile({ language: lang });
        const refreshedUser = await refreshUser();
        if (!refreshedUser) {
          updateUser({ ...user, language: lang, role: user?.role });
        }
      } catch (err) {
        console.error('Failed to update language on server', err);
      }
    }
  };

  const refreshPremiumStatus = async () => {
    try {
      const statusRes = await premiumAPI.getStatus();
      setPremiumStatus(statusRes.data);
    } catch (err) {
      console.error('Failed to refresh premium status', err);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAdmin: (user?.role || '').toString().toLowerCase() === 'admin',
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    premiumStatus,
    refreshPremiumStatus,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
