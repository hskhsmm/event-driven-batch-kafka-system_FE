import apiClient from './client';
import type { ApiResponse, LogEntry } from '../types/index';

// 최근 로그 조회
export const getRecentLogs = async (limit: number = 100): Promise<LogEntry[]> => {
  const response = await apiClient.get<ApiResponse<LogEntry[]>>(
    `/api/admin/logs?limit=${limit}`
  );
  return response.data.data;
};

// 모든 로그 조회
export const getAllLogs = async (): Promise<LogEntry[]> => {
  const response = await apiClient.get<ApiResponse<LogEntry[]>>('/api/admin/logs/all');
  return response.data.data;
};

// 로그 초기화
export const clearLogs = async (): Promise<void> => {
  await apiClient.delete('/api/admin/logs');
};
