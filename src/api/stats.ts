import apiClient from './client';
import type { DailyStatsResponse, CampaignStatsResponse, ApiResponse } from '../types/index';

// 일자별 전체 통계 조회
export const getDailyStats = async (date: string): Promise<DailyStatsResponse> => {
  const response = await apiClient.get<ApiResponse<DailyStatsResponse>>(
    `/api/admin/stats/daily?date=${date}`
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
