import axios from 'axios';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
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

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버가 에러 응답을 반환한 경우
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // 요청은 보내졌지만 응답이 없는 경우
      console.error('No response:', error.request);
    } else {
      // 요청 설정 중 에러가 발생한 경우
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
