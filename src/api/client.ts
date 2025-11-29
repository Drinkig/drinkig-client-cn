import axios from 'axios';
import { Platform } from 'react-native';

// Android 에뮬레이터에서는 localhost 대신 10.0.2.2를 사용해야 할 수 있습니다.
// iOS 시뮬레이터에서는 localhost(127.0.0.1)가 잘 작동합니다.
const baseURL = 'http://127.0.0.1:8080';

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
        // 주의: refreshToken은 보통 AsyncStorage나 SecureStore에 저장되어 있다고 가정
        // 여기서는 API 호출만 구현하고 실제 토큰 가져오는 로직은 상황에 맞게 추가 필요
        
        // const refreshToken = await getRefreshToken(); // 저장된 리프레시 토큰 가져오기
        
        const response = await client.post('/reissue', {
          // headers: { Authorization: `Bearer ${refreshToken}` } // 필요 시 헤더 추가
        });

        if (response.data.isSuccess) {
          // 재발급 받은 Access Token 저장 및 헤더 갱신 로직 필요
          // const newAccessToken = response.data.result.accessToken;
          // client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          // originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          return client(originalRequest); // 원래 요청 재시도
        }
      } catch (reissueError) {
        // 재발급 실패 시 (Refresh Token도 만료됨) -> 로그아웃 처리 필요
        console.error('Token reissue failed:', reissueError);
        // logout();
        return Promise.reject(reissueError);
      }
    }

    return Promise.reject(error);
  }
);

// 토큰 재발급 API 함수 (수동 호출용)
export const reissueToken = async () => {
  const response = await client.post<{
    isSuccess: boolean;
    code: string;
    message: string;
    result: any; // 구체적인 토큰 응답 타입에 맞춰 수정 필요
  }>('/reissue');
  return response.data;
};

export default client;
