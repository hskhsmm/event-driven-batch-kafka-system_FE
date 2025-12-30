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
  Skeleton,
} from '@mui/material';
import type { Campaign } from '../../types/index';
import { getCampaigns, participateCampaign } from '../../api';
import { useToast } from '../../components/ToastProvider';

const CampaignListPage = () => {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [participating, setParticipating] = useState(false);

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
      await participateCampaign(selectedCampaign.id, { userId });
      setSelectedCampaign(null);
      showToast('참여 요청이 접수되었습니다! 결과는 잠시 후 확인 가능합니다.', 'success');
      // 참여 후 목록 새로고침
      loadCampaigns();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '참여 요청 중 오류가 발생했습니다.';
      showToast(errorMsg, 'error');
      setSelectedCampaign(null);
    } finally {
      setParticipating(false);
    }
  };

  // 모달 닫기
  const handleCloseDialog = () => {
    setSelectedCampaign(null);
  };

  const CampaignSkeleton = () => (
    <Grid item xs={12} sm={6} md={4}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton variant="text" height={40} width="80%" />
          <Skeleton variant="text" height={20} width="40%" sx={{ mt: 1 }} />
          <Skeleton variant="text" height={30} width="60%" sx={{ mt: 2 }} />
          <Skeleton variant="rectangular" height={8} sx={{ mt: 2, borderRadius: 4 }} />
          <Skeleton variant="text" height={20} width="30%" sx={{ mt: 1 }} />
        </CardContent>
        <CardActions>
          <Skeleton variant="rectangular" height={48} width="100%" sx={{ borderRadius: 1 }} />
        </CardActions>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ py: 4 }}>
      {/* 헤더 섹션 */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            mb: 2,
            fontSize: { xs: '2rem', md: '3rem' },
          }}
        >
          모든 캠페인
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 400 }}>
          참여 가능한 모든 캠페인을 확인하세요
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            px: 5,
            py: 3,
            bgcolor: '#fafafa',
            border: '1px solid #e0e0e0',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {campaigns.filter((c) => c.status === 'OPEN' && c.currentStock > 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              진행 중
            </Typography>
          </Box>
          <Box sx={{ width: 1, height: 40, bgcolor: 'divider' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight="bold" color="text.secondary">
              {campaigns.filter((c) => c.status === 'CLOSED' || c.currentStock === 0).length}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              마감
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        {loading && campaigns.length === 0
          ? [1, 2, 3, 4, 5, 6].map((n) => <CampaignSkeleton key={n} />)
          : campaigns.map((campaign) => {
          const stockPercentage = (campaign.currentStock / campaign.totalStock) * 100;
          const isOpen = campaign.status === 'OPEN' && campaign.currentStock > 0;

          return (
            <Grid item xs={12} sm={6} md={4} key={campaign.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 4 }}>
                  <Typography variant="h5" gutterBottom fontWeight={700}>
                    {campaign.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color={isOpen ? 'success.main' : 'text.secondary'}
                    sx={{ mb: 3, fontWeight: 600 }}
                  >
                    {isOpen ? '진행 중' : '마감'}
                  </Typography>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    {campaign.currentStock.toLocaleString()} / {campaign.totalStock.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stockPercentage}
                    sx={{
                      mt: 2,
                      height: 6,
                      backgroundColor: '#f0f0f0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#000000',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {stockPercentage.toFixed(1)}% 남음
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
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
    </Box>
  );
};

export default CampaignListPage;
