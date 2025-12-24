import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

// Android 에뮬레이터에서는 localhost 대신 10.0.2.2를 사용해야 할 수 있습니다.
// iOS 시뮬레이터에서는 localhost(127.0.0.1)가 잘 작동합니다.
// iOS 시뮬레이터에서는 localhost(127.0.0.1)가 잘 작동합니다.
// .env에 API_URL이 정의되어 있으면 그것을 우선 사용합니다.
const baseURL = Config.API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://127.0.0.1:8080');

const client = axios.create({
  baseURL,
  timeout: 10000, // 10초로 증가 (애플 로그인 등 외부 API 통신 고려)
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
    // 단, 로그인 요청(/login/apple) 자체에서 401이 난 경우는 재발급 시도하면 안 됨 (무한 루프 방지)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/login/apple')) {
      originalRequest._retry = true;

      try {
        // Refresh Token으로 Access Token 재발급 요청
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // [EDIT] 서버 요구사항: refreshToken을 쿠키 헤더로 전송
        // 일부 환경에서 Cookie 헤더가 제대로 동작하지 않을 수 있으므로 Body에도 추가
        const response = await axios.post(`${baseURL}/reissue`, {
          refreshToken: refreshToken // Body에도 추가
        }, {
          headers: {
            Cookie: `refreshToken=${refreshToken}`,
            'Authorization-Refresh': `Bearer ${refreshToken}` // 혹시 몰라 커스텀 헤더도 추가
          }
        });

        if (response.data.isSuccess) {

          // Access Token 추출 로직 강화 (Body 또는 Header 확인)
          let newAccessToken = response.data.result?.accessToken;
          const newRefreshToken = response.data.result?.refreshToken;

          // Body에 없으면 헤더(Authorization)에서 확인
          if (!newAccessToken) {
            const authHeader = response.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
              newAccessToken = authHeader.substring(7);
            }
          }

          // Access Token이 여전히 없으면 에러 처리
          if (!newAccessToken) {
            throw new Error('No access token in reissue response');
          }

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
