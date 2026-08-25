import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  {
    name: 'Jesús Pérez',
    username: 'chulox',
    email: 'chulox@vybe.app',
    role: 'user',
    bio: 'Desarrollador Full Stack',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Maya Lin',
    username: 'maya.design',
    email: 'maya@vybe.app',
    role: 'user',
    bio: 'Design Systems Lead',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Alex Rivera',
    username: 'alex.ai',
    email: 'alex@vybe.app',
    role: 'user',
    bio: 'AI Researcher & ML Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sarah Jenkins',
    username: 'sarah_code',
    email: 'sarah@vybe.app',
    role: 'user',
    bio: 'Cloud Architect & Backend Ninja',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    name: 'Equipo VYBE (Admin)',
    username: 'admin',
    email: 'admin@vybe.app',
    role: 'admin',
    bio: 'Moderador & Administrador',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.success) {
          setUser(response.data);
        }
      } catch (err) {
        console.warn('Error loading active session, clearing token:', err.message);
        api.setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const register = async ({ full_name, username, email, password }) => {
    const res = await api.post('/auth/register', { full_name, username, email, password });
    if (res.success && res.data) {
      api.setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const loginDemo = async (email) => {
    return login(email, 'Password123!');
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    if (res.success && res.data) {
      setUser(res.data);
      return res.data;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginDemo,
        updateProfile,
        logout,
        setUser,
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
