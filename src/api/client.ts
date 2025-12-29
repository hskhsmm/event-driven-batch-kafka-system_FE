import axios from 'axios';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: '', // Vite 프록시 사용
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import { ApiError } from './error';

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    // 백엔드 API가 응답은 성공(2xx)으로 주지만, 내용상 에러일 경우 (e.g. success: false)
    if (response.data && response.data.success === false) {
      return Promise.reject(
        new ApiError(
          response.data.message,
          response.data.errorCode,
          response.status
        )
      );
    }
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // 서버가 에러 상태 코드로 응답한 경우 (4xx, 5xx)
        const { message, errorCode } = error.response.data;
        return Promise.reject(
          new ApiError(message, errorCode, error.response.status)
        );
      } else if (error.request) {
        // 요청은 이루어졌으나 응답을 받지 못한 경우
        return Promise.reject(new ApiError('서버에서 응답이 없습니다.'));
      }
    }
    // 요청 설정 중 발생한 오류나 기타 자바스크립트 오류
    return Promise.reject(new ApiError(error.message || '알 수 없는 오류가 발생했습니다.'));
  }
);

export default apiClient;
