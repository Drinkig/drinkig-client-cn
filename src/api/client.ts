import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

const baseURL = Config.API_URL || 'https://api.drinkig.com';

const client = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/login/apple')) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${baseURL}/reissue`, {
          refreshToken: refreshToken
        }, {
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
            'Authorization-Refresh': `Bearer ${refreshToken}`
          }
        });

        if (response.data.isSuccess) {

          let newAccessToken = response.data.result?.accessToken;
          const newRefreshToken = response.data.result?.refreshToken;

          if (!newAccessToken) {
            const authHeader = response.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              newAccessToken = authHeader.substring(7);
            }
          }

          if (!newAccessToken) {
            throw new Error('No access token in reissue response');
          }

          await AsyncStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }

          client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          return client(originalRequest);
        }
      } catch (reissueError) {
        console.error('Token reissue failed:', reissueError);

        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');

        return Promise.reject(reissueError);
      }
    }

    return Promise.reject(error);
  }
);

client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const reissueToken = async () => {
  const response = await client.post<{
    isSuccess: boolean;
    code: string;
    message: string;
    result: any;
  }>('/reissue');
  return response.data;
};

export default client;
