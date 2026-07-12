import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* Request interceptor: attach JWT token */
api.interceptors.request.use(
  async (config) => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('chat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* Response interceptor: handle auth errors */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.multiRemove(['chat_token', 'chat_user']);
    }
    return Promise.reject(error);
  }
);

export default api;