// Campaign (캠페인)
export interface Campaign {
  id: number;
  name: string;
  totalStock: number;
  currentStock: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

// Campaign 생성 요청
export interface CreateCampaignRequest {
  name: string;
  totalStock: number;
}

// Participation 요청
export interface ParticipationRequest {
  userId: number;
}

// ParticipationHistory (참여 이력)
export interface ParticipationHistory {
  id: number;
  campaignId: number;
  userId: number;
  status: 'SUCCESS' | 'FAIL';
  createdAt: string;
}

// CampaignStats (캠페인 통계)
export interface CampaignStats {
  id: number;
  campaignId: number;
  statsDate: string;
  successCount: number;
  failCount: number;
  createdAt: string;
  updatedAt: string;
}

// DailyStats 응답
export interface DailyStatsResponse {
  date: string;
  summary?: {
    totalCampaigns: number;
    totalSuccess: number;
    totalFail: number;
    totalParticipation: number;
    overallSuccessRate: string;
  };
  message?: string;
  campaigns: Array<{
    campaignId: number;
    campaignName: string;
    successCount: number;
    failCount: number;
    totalCount: number;
    successRate: string;
    statsDate: string;
  }>;
}

// CampaignStats 응답
export interface CampaignStatsResponse {
  campaignId: number;
  campaignName: string;
  startDate: string;
  endDate: string;
  summary: {
    totalSuccess: number;
    totalFail: number;
    totalParticipation: number;
    averageSuccessRate: string;
  };
  dailyStats: Array<{
    date: string;
    successCount: number;
    failCount: number;
    totalCount: number;
    successRate: string;
  }>;
}

// BatchExecution (배치 실행)
export interface BatchExecution {
  jobExecutionId: number;
  jobName: string;
  status: 'STARTING' | 'STARTED' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  exitStatus: string;
  exitDescription: string;
  startTime: string;
  endTime: string;
  targetDate: string;
  updatedRows?: string;
}

// BatchExecution 시작 응답
export interface BatchStartResponse {
  jobExecutionId: number;
  jobInstanceId: number;
  status: string;
  date: string;
  message: string;
}

// BatchHistory 응답
export interface BatchHistoryResponse {
  jobName: string;
  totalCount: number;
  history: Array<{
    jobInstanceId: number;
    jobName: string;
    jobExecutionId: number;
    status: string;
    exitStatus: string;
    startTime: string;
    endTime: string;
    targetDate: string;
    updatedRows: string;
  }>;
}
