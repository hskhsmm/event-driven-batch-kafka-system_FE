import apiClient from './client';
import type { ParticipationRequest } from '../types/index';

// 캠페인 참여
export const participateCampaign = async (
  campaignId: number,
  data: ParticipationRequest
): Promise<string> => {
  const response = await apiClient.post<string>(
    `/api/campaigns/${campaignId}/participation`,
    data
  );
  return response.data;
};
