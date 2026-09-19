import { useState, useEffect } from 'react';

export interface UserSession {
  isLoggedIn: boolean;
  address: string;
  demoBalance: number;
  positions: any[];
}

const DEFAULT_SESSION: UserSession = {
  isLoggedIn: false,
  address: '',
  demoBalance: 10000.00,
  positions: [],
};

export function usePersistentAuth() {
  const [session, setSession] = useState<UserSession>(() => {
    if (typeof window === 'undefined') return DEFAULT_SESSION;
    try {
      const saved = localStorage.getItem('hexagonal_dex_session');
      return saved ? JSON.parse(saved) : DEFAULT_SESSION;
    } catch {
      return DEFAULT_SESSION;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('hexagonal_dex_session', JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  }, [session]);

  const login = (walletAddress?: string) => {
    const addr = walletAddress || `0x7a...${Math.floor(1000 + Math.random() * 9000)}`;
    setSession((prev) => ({
      ...prev,
      isLoggedIn: true,
      address: addr,
    }));
  };

  const logout = () => {
    setSession(DEFAULT_SESSION);
    localStorage.removeItem('hexagonal_dex_session');
  };

  const updateBalance = (newBalance: number) => {
    setSession((prev) => ({ ...prev, demoBalance: newBalance }));
  };

  return { session, login, logout, updateBalance, setSession };
    }

