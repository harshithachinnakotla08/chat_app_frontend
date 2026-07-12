import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/constants';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Restore session from storage on mount */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('chat_token');
        const storedUser = await AsyncStorage.getItem('chat_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          /* Verify token is still valid */
          const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setUser(res.data.data);
          await AsyncStorage.setItem('chat_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        /* Token invalid or expired — clear storage */
        await AsyncStorage.multiRemove(['chat_token', 'chat_user']);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      username,
      password,
    });

    const { token: newToken, user: userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem('chat_token', newToken);
    await AsyncStorage.setItem('chat_user', JSON.stringify(userData));

    return userData;
  }, []);

  const signup = useCallback(async (username, password) => {
    const res = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
      username,
      password,
    });

    const { token: newToken, user: userData } = res.data.data;
    setToken(newToken);
    setUser(userData);
    await AsyncStorage.setItem('chat_token', newToken);
    await AsyncStorage.setItem('chat_user', JSON.stringify(userData));

    return userData;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['chat_token', 'chat_user']);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}