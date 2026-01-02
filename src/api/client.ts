import axios from 'axios';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';
import { getAccessToken } from '../utils/tokenStorage';

const baseURL = Config.API_URL || 'https://api.drinkig.com';

const client = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  async (config) => {
    // 1. Try to get backend access token first
    const accessToken = await getAccessToken();
    if (accessToken) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers['Authorization'] = `Bearer ${accessToken}`;
      return config;
    }

    // 2. Fallback to Firebase ID Token (Legacy/Other auth methods)
    const user = auth().currentUser;

    if (user) {
      try {
        const token = await user.getIdToken(true);
        if (!config.headers) {
          config.headers = {} as any;
        }
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        console.error('[API Request] Failed to get ID token', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log(`[API Error] 401 Unauthorized for ${error.config.url}`);
      console.log('[API Error] Server Message:', JSON.stringify(error.response.data));
    }
    return Promise.reject(error);
  }
);

export default client;
