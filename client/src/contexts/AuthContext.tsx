import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, UserSettings, UserStreak } from '../types';

interface AuthContextType {
  user: User | null;
  settings: UserSettings | null;
  streak: UserStreak | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('interviewai_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    const savedToken = localStorage.getItem('interviewai_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data.user);
      setSettings(res.data.settings);
      setStreak(res.data.streak);
    } catch (err) {
      localStorage.removeItem('interviewai_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('interviewai_token', newToken);
    setToken(newToken);
    setUser(newUser);
    refreshSession();
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('interviewai_token')) {
        await apiClient.post('/auth/logout');
      }
    } catch (e) {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem('interviewai_token');
      setToken(null);
      setUser(null);
      setSettings(null);
      setStreak(null);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updatedFields });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        streak,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshSession,
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
