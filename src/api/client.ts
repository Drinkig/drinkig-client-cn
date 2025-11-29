import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android 에뮬레이터에서는 localhost 대신 10.0.2.2를 사용해야 할 수 있습니다.
// iOS 시뮬레이터에서는 localhost(127.0.0.1)가 잘 작동합니다.
const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://127.0.0.1:8080';

const client = axios.create({
  baseURL,
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인터셉터 설정: 토큰 만료 시 자동 재발급 로직
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러 발생 시 (토큰 만료)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh Token으로 Access Token 재발급 요청
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Refresh Token을 헤더에 담아 재발급 요청
        // (서버 스펙에 따라 Body에 담거나 쿠키를 사용할 수 있음)
        const response = await axios.post(`${baseURL}/reissue`, {}, {
          headers: {
            Authorization: `Bearer ${refreshToken}`
          }
        });

        if (response.data.isSuccess) {
          const newAccessToken = response.data.result.accessToken;
          const newRefreshToken = response.data.result.refreshToken;

          // 새로운 토큰 저장
          await AsyncStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
          }

          // 헤더 갱신
          client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          return client(originalRequest); // 원래 요청 재시도
        }
      } catch (reissueError) {
        // 재발급 실패 시 (Refresh Token도 만료됨) -> 로그아웃 처리 필요
        console.error('Token reissue failed:', reissueError);
        
        // 토큰 삭제
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // 여기서 바로 네비게이션을 할 수는 없으므로 (React 컴포넌트가 아님),
        // 에러를 throw하여 UI 단에서 로그인 화면으로 이동하도록 처리해야 함
        return Promise.reject(reissueError);
      }
    }

    return Promise.reject(error);
  }
);

// 요청 인터셉터: 저장된 Access Token이 있으면 헤더에 추가
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

// 토큰 재발급 API 함수 (수동 호출용)
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
