import apiClient from './client';
import type {
  ApiResponse,
  Campaign,
  CampaignRealtimeStatus,
  CreateCampaignRequest,
  SyncParticipationResponse,
} from '../types/index';

// 캠페인 목록 조회
export const getCampaigns = async (): Promise<Campaign[]> => {
  const response = await apiClient.get<ApiResponse<Campaign[]>>('/api/admin/campaigns');
  return response.data.data;
};

// 캠페인 생성
export const createCampaign = async (data: CreateCampaignRequest): Promise<Campaign> => {
  const response = await apiClient.post<ApiResponse<Campaign>>('/api/admin/campaigns', data);
  return response.data.data;
};

// 실시간 캠페인 현황 조회
export const getCampaignRealtimeStatus = async (campaignId: number): Promise<CampaignRealtimeStatus> => {
  const response = await apiClient.get<ApiResponse<CampaignRealtimeStatus>>(
    `/api/campaigns/${campaignId}/status`
  );
  return response.data.data;
};

// 동기 방식 참여 API (비교용)
export const participateSync = async (
  campaignId: number,
  userId: number
): Promise<SyncParticipationResponse> => {
  const response = await apiClient.post<ApiResponse<SyncParticipationResponse>>(
    `/api/campaigns/${campaignId}/participation-sync`,
    { userId }
  );
  return response.data.data;
};
