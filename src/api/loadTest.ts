import apiClient from './client';
import type { ApiResponse } from '../types';

export interface LoadTestRequest {
  campaignId: number;
  virtualUsers?: number;
  duration?: number;
}

export interface LoadTestMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  min: number;
  totalRequests: number;
  throughput: number;
  failureRate: number;
}

export interface LoadTestResult {
  jobId: string;
  method: 'KAFKA' | 'SYNC';
  campaignId: number;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  metrics?: LoadTestMetrics;
  error?: string;
  completedAt?: string;
}

// Kafka 방식 테스트 실행
export const executeKafkaTest = async (request: LoadTestRequest): Promise<{ jobId: string }> => {
  const response = await apiClient.post<ApiResponse<{ jobId: string }>>(
    '/api/admin/load-test/kafka',
    request
  );
  return response.data.data;
};

// 동기 방식 테스트 실행
export const executeSyncTest = async (request: LoadTestRequest): Promise<{ jobId: string }> => {
  const response = await apiClient.post<ApiResponse<{ jobId: string }>>(
    '/api/admin/load-test/sync',
    request
  );
  return response.data.data;
};

// 테스트 결과 조회
export const getLoadTestResult = async (jobId: string): Promise<LoadTestResult> => {
  const response = await apiClient.get<ApiResponse<LoadTestResult>>(
    `/api/admin/load-test/results/${jobId}`
  );
  return response.data.data;
};
