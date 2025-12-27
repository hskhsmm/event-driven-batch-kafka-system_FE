import apiClient from './client';
import type { Campaign, CreateCampaignRequest } from '../types/index';

// 캠페인 목록 조회
export const getCampaigns = async (): Promise<Campaign[]> => {
  const response = await apiClient.get<ApiResponse<Campaign[]>>('/api/admin/campaigns');
  return response.data.data;
};

// 캠페인 생성
export const createCampaign = async (data: CreateCampaignRequest): Promise<Campaign> => {
  const response = await apiClient.post<Campaign>('/api/admin/campaigns', data);
  return response.data;
};
