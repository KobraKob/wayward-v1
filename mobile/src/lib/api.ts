import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your local IP when testing on a physical device
const API_URL = "https://wayward-backend-e1hu.onrender.com";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
