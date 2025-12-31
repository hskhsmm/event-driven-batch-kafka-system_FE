import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  LinearProgress,
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../../api/client';

interface CampaignStatus {
  campaignId: number;
  campaignName: string;
  totalStock: number;
  currentStock: number;
  successCount: number;
  failCount: number;
  totalParticipation: number;
  stockUsageRate: string;
}

interface TPSDataPoint {
  time: string;
  tps: number;
  successCount: number;
  failCount: number;
}

const RealtimeMonitoring = () => {
  const [campaignId, setCampaignId] = useState('1');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [tpsHistory, setTpsHistory] = useState<TPSDataPoint[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);

  // 이전 재고 추적 (TPS 계산용)
  const [prevStock, setPrevStock] = useState<number | null>(null);
  const [prevTime, setPrevTime] = useState<number | null>(null);

  // 폴링
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/campaigns/${campaignId}/status`);
        const newStatus: CampaignStatus = response.data.data;

        setStatus(newStatus);

        // TPS 계산
        if (prevStock !== null && prevTime !== null) {
          const stockChange = prevStock - newStatus.currentStock;
          const timeElapsed = (Date.now() - prevTime) / 1000; // 초 단위

          const tps = stockChange / timeElapsed;
          setCurrentTPS(Math.max(0, tps));

          // 히스토리 추가
          const now = new Date();
          const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false });

          setTpsHistory(prev => {
            const updated = [...prev, {
              time: timeStr,
              tps: Math.max(0, tps),
              successCount: newStatus.successCount,
              failCount: newStatus.failCount,
            }];

            // 최근 60개만 유지 (1분간)
            return updated.slice(-60);
          });
        }

        setPrevStock(newStatus.currentStock);
        setPrevTime(Date.now());

      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, campaignId, prevStock, prevTime]);

  const handleStart = () => {
    setIsMonitoring(true);
    setTpsHistory([]);
    setPrevStock(null);
    setPrevTime(null);
  };

  const handleStop = () => {
    setIsMonitoring(false);
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        실시간 모니터링 대시보드
      </Typography>

      {/* 컨트롤 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="캠페인 ID"
            type="number"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            size="small"
            disabled={isMonitoring}
          />
          {!isMonitoring ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStart}
            >
              모니터링 시작
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStop}
            >
              중지
            </Button>
          )}
        </Box>
      </Paper>

      {status && (
        <>
          {/* 현재 TPS */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
            <Typography variant="h6">현재 TPS (Transactions Per Second)</Typography>
            <Typography variant="h2">{currentTPS.toFixed(2)} req/s</Typography>
          </Paper>

          {/* 메트릭 카드 */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    재고 현황
                  </Typography>
                  <Typography variant="h4">
                    {status.currentStock} / {status.totalStock}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(status.stockUsageRate)}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    성공
                  </Typography>
                  <Typography variant="h4">
                    {status.successCount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    실패
                  </Typography>
                  <Typography variant="h4">
                    {status.failCount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    성공률
                  </Typography>
                  <Typography variant="h4">
                    {status.totalParticipation > 0
                      ? ((status.successCount / status.totalParticipation) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* TPS 그래프 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              TPS 추이 (실시간)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={tpsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tps"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  name="TPS"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default RealtimeMonitoring;
