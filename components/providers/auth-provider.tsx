'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import apiService from '@/lib/services/api';
import { User } from '@/lib/types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && apiService.isAuthenticated();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          // Chỉ cần kiểm tra có token hay không
          // Set user = {} để đánh dấu đã authenticated
          setUser({ id: 1, username: 'user', email: '', is_active: true, created_at: '', updated_at: '' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid auth state without navigation
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login({ username, password });
      
      if (response && response.access_token) {
        // Token đã được lưu trong apiService.login()
        // Tạm thời set user = {} để đánh dấu đã authenticated
        setUser({ id: 1, username: 'user', email: '', is_active: true, created_at: '', updated_at: '' });
        toast.success('Đăng nhập thành công');
        router.push('/dashboard');
      } else {
        const errorMessage = 'Đăng nhập thất bại';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Show error toast if not already shown
      if (!error.message || !error.message.includes('Đăng nhập thất bại')) {
        toast.error(error.message || 'Có lỗi xảy ra khi đăng nhập');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/');
    }
  };

  const refreshUser = async () => {
    // Không cần refresh user data nữa, chỉ kiểm tra token
    try {
      if (!apiService.isAuthenticated()) {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
