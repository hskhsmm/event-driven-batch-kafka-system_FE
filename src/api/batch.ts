import apiClient from './client';
import type {
  ApiResponse,
  BatchStartResponse,
  BatchExecution,
  BatchHistoryResponse,
} from '../types/index';

// 배치 수동 실행
export const executeBatch = async (date: string): Promise<BatchStartResponse> => {
  const response = await apiClient.post<ApiResponse<BatchStartResponse>>(
    `/api/admin/batch/aggregate?date=${date}`
  );
  return response.data.data;
};

// 배치 실행 상태 조회
export const getBatchStatus = async (jobExecutionId: number): Promise<BatchExecution> => {
  const response = await apiClient.get<ApiResponse<BatchExecution>>(
    `/api/admin/batch/status/${jobExecutionId}`
  );
  return response.data.data;
};

// 배치 실행 이력 조회
export const getBatchHistory = async (
  jobName: string = 'aggregateParticipation',
  size: number = 20
): Promise<BatchHistoryResponse> => {
  const response = await apiClient.get<ApiResponse<BatchHistoryResponse>>(
    `/api/admin/batch/history?jobName=${jobName}&size=${size}`
  );
  return response.data.data;
};

// 참여 요청 시뮬레이션 (부하 테스트)
export const simulateParticipation = async (
  campaignId: number,
  count: number
): Promise<string> => {
  const response = await apiClient.post<ApiResponse<any>>(
    '/api/admin/test/participate-bulk',
    { campaignId, count }
  );
  return response.data.message;
};
