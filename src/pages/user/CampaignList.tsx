import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import type { Campaign } from '../../types/index';
import { getCampaigns, participateCampaign } from '../../api';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [participating, setParticipating] = useState(false);
  const [participationResult, setParticipationResult] = useState<string | null>(null);

  // 캠페인 목록 로드
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      setError('캠페인 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
    // 5초마다 재고 업데이트
    const interval = setInterval(loadCampaigns, 5000);
    return () => clearInterval(interval);
  }, []);

  // 참여하기 버튼 클릭
  const handleParticipateClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
  };

  // 참여 확인
  const handleConfirmParticipation = async () => {
    if (!selectedCampaign) return;

    try {
      setParticipating(true);
      // 랜덤 userId 생성 (실제로는 로그인한 사용자 ID 사용)
      const userId = Math.floor(Math.random() * 100000) + 1;
      const message = await participateCampaign(selectedCampaign.id, { userId });
      setParticipationResult(message);
      setSelectedCampaign(null);
      // 참여 후 목록 새로고침
      loadCampaigns();
    } catch (err: any) {
      setParticipationResult(
        err.response?.data?.error || '참여 요청 중 오류가 발생했습니다.'
      );
    } finally {
      setParticipating(false);
    }
  };

  // 모달 닫기
  const handleCloseDialog = () => {
    setSelectedCampaign(null);
  };

  const handleCloseResultDialog = () => {
    setParticipationResult(null);
  };

  if (loading && campaigns.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        선착순 이벤트
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {campaigns.map((campaign) => {
          const stockPercentage = (campaign.currentStock / campaign.totalStock) * 100;
          const isOpen = campaign.status === 'OPEN' && campaign.currentStock > 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {campaign.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    상태: {campaign.status === 'OPEN' ? '진행 중' : '마감'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    남은 수량: {campaign.currentStock.toLocaleString()} /{' '}
                    {campaign.totalStock.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stockPercentage}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!isOpen}
                    onClick={() => handleParticipateClick(campaign)}
                  >
                    {isOpen ? '참여하기' : '마감되었습니다'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 참여 확인 모달 */}
      <Dialog open={!!selectedCampaign} onClose={handleCloseDialog}>
        <DialogTitle>참여 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{selectedCampaign?.name}" 캠페인에 참여하시겠습니까?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleConfirmParticipation}
            variant="contained"
            disabled={participating}
          >
            {participating ? <CircularProgress size={24} /> : '확인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 참여 결과 모달 */}
      <Dialog open={!!participationResult} onClose={handleCloseResultDialog}>
        <DialogTitle>참여 결과</DialogTitle>
        <DialogContent>
          <DialogContentText>{participationResult}</DialogContentText>
          <Alert severity="info" sx={{ mt: 2 }}>
            결과는 잠시 후 확인 가능합니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultDialog} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampaignList;
