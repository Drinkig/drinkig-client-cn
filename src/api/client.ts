import axios from 'axios';
import { Platform } from 'react-native';
import Config from 'react-native-config';
import auth from '@react-native-firebase/auth';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../utils/tokenStorage';
import { reissueToken } from './member';

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
    // 0. Skip auth headers for reissue endpoint
    if (config.url?.includes('/reissue')) {
      return config;
    }

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
    const originalRequest = error.config;

    // Check if error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite loop: if the failed request was the refresh attempt itself, stop.
      if (originalRequest.url?.includes('/reissue')) {
        console.log('[API Error] Refresh token is invalid/expired. Logging out...');
        await clearTokens();
        return Promise.reject(error);
      }

      console.log(`[API Error] 401 Unauthorized for ${error.config.url}. Attempting refresh...`);
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }


        const { result } = await reissueToken(refreshToken);

        if (result && result.accessToken && result.refreshToken) {
          await saveTokens(result.accessToken, result.refreshToken);

          // Update default headers and original request headers
          client.defaults.headers.common['Authorization'] = `Bearer ${result.accessToken}`;

          // Force update the header
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${result.accessToken}`;
          }

          console.log('[API Refresh] Token refreshed successfully. Retrying request...');
          return client(originalRequest);
        } else {
          throw new Error('Invalid reissue response');
        }
      } catch (refreshError) {
        console.error('[API Refresh] Token refresh failed:', refreshError);
        await clearTokens();
        // Here you might want to redirect to login or emit an event
        // For now, we just let the error propagate so the UI can handle it (e.g. show toast or logout)
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      console.log('[API Error] Server Message:', JSON.stringify(error.response.data));
    }

    return Promise.reject(error);
  }
);

export default client;
