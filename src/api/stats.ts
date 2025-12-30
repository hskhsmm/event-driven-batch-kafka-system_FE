import apiClient from './client';
import type { PerformanceStats, CampaignStatsResponse, ApiResponse } from '../types/index';

// 일자별 배치 집계 통계 조회 (빠른 API)
export const getDailyPerformanceStats = async (date: string): Promise<PerformanceStats> => {
  const response = await apiClient.get<ApiResponse<PerformanceStats>>(
    `/api/admin/stats/daily?date=${date}`
  );
  return response.data.data;
};

// 일자별 원본 데이터 집계 통계 조회 (느린 API)
export const getRawPerformanceStats = async (date: string): Promise<PerformanceStats> => {
  const response = await apiClient.get<ApiResponse<PerformanceStats>>(
    `/api/admin/stats/raw?date=${date}`
  );
  return response.data.data;
};

// 캠페인별 기간 통계 조회
export const getCampaignStats = async (
  campaignId: number,
  startDate?: string,
  endDate?: string
): Promise<CampaignStatsResponse> => {
  let url = `/api/admin/stats/campaign/${campaignId}`;
  const params = new URLSearchParams();

  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await apiClient.get<ApiResponse<CampaignStatsResponse>>(url);
  return response.data.data;
};
