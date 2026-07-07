import axios from "axios";
import { Platform } from "react-native";
import Config from "react-native-config";
import auth from "@react-native-firebase/auth";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
} from "../utils/tokenStorage";
import { reissueToken } from "./member";

const baseURL = Config.API_URL || "https://api.drinkig.com";

const client = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 토큰 리프레시가 최종 실패했을 때(=세션 만료) UI 레이어가 로그아웃/안내를
// 처리할 수 있도록 콜백을 등록한다. 등록처: SessionExpiredHandler 컴포넌트.
let onSessionExpired: (() => void) | null = null;
let lastSessionExpiredAt = 0;

export const setOnSessionExpired = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

const notifySessionExpired = () => {
  // 만료 직후 여러 요청이 동시에 401로 떨어져도 알림은 한 번만
  const now = Date.now();
  if (now - lastSessionExpiredAt < 5000) return;
  lastSessionExpiredAt = now;
  onSessionExpired?.();
};

client.interceptors.request.use(
  async (config) => {
    // 0. Skip auth headers for reissue endpoint
    if (config.url?.includes("/reissue")) {
      return config;
    }

    // 1. Try to get backend access token first
    const accessToken = await getAccessToken();
    if (accessToken) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${accessToken}`;
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
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.error("[API Request] Failed to get ID token", e);
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
      if (originalRequest.url?.includes("/reissue")) {
        console.log(
          "[API Error] Refresh token is invalid/expired. Logging out..."
        );
        await clearTokens();
        notifySessionExpired();
        return Promise.reject(error);
      }

      console.log(
        `[API Error] 401 Unauthorized for ${error.config.url}. Attempting refresh...`
      );
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const { result } = await reissueToken(refreshToken);

        if (result && result.accessToken && result.refreshToken) {
          await saveTokens(result.accessToken, result.refreshToken);

          // Update default headers and original request headers
          client.defaults.headers.common.Authorization = `Bearer ${result.accessToken}`;

          // Force update the header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${result.accessToken}`;
          }

          console.log(
            "[API Refresh] Token refreshed successfully. Retrying request..."
          );
          return client(originalRequest);
        } else {
          throw new Error("Invalid reissue response");
        }
      } catch (refreshError) {
        console.error("[API Refresh] Token refresh failed:", refreshError);
        await clearTokens();
        notifySessionExpired();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      console.log(
        "[API Error] Server Message:",
        JSON.stringify(error.response.data)
      );
    }

    return Promise.reject(error);
  }
);

export default client;
