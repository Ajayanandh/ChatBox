'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, AuthState } from '@/types/user';
import { api } from '@/lib/api';
import { getStoredToken, setStoredToken, removeStoredToken } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    try {
      const user = await api.auth.getMe();
      setState({
        user,
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      removeStoredToken();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleUnauthorized = () => {
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await api.auth.login(email, pass);
      setStoredToken(data.access_token);
      setState({
        user: data.user,
        token: data.access_token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const register = async (email: string, pass: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await api.auth.register(email, pass);
      setStoredToken(data.access_token);
      setState({
        user: data.user,
        token: data.access_token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      removeStoredToken();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
