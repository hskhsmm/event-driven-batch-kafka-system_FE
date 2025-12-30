import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Search, FlashOn } from '@mui/icons-material';
import type {
  Campaign,
  CampaignStatsResponse,
  CampaignRealtimeStatus,
} from '../../types/index';
import { getCampaigns, getCampaignStats, getCampaignRealtimeStatus } from '../../api';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// --- 실시간 모니터링 컴포넌트 ---
const RealtimeMonitor = ({ campaignId }: { campaignId: number }) => {
  const [status, setStatus] = useState<CampaignRealtimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tps, setTps] = useState(0); // Transactions Per Second
  const prevTotalParticipation = useRef(0);

  useEffect(() => {
    if (!campaignId) return;

    const fetchStatus = async () => {
      try {
        const data = await getCampaignRealtimeStatus(campaignId);
        setStatus(data);
        
        // TPS 계산
        const currentTotal = data.totalParticipation;
        setTps(currentTotal - prevTotalParticipation.current);
        prevTotalParticipation.current = currentTotal;

        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || '실시간 데이터를 불러오는 데 실패했습니다.');
      }
    };

    fetchStatus(); // 초기 즉시 호출
    const interval = setInterval(fetchStatus, 1000);

    return () => clearInterval(interval);
  }, [campaignId]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!status) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={30} /></Box>;
  }

  const stockUsagePercent = parseFloat(status.stockUsageRate.replace('%', ''));

  return (
    <Paper sx={{ p: 3, mb: 4, border: '1px solid', borderColor: 'primary.main' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <FlashOn sx={{ mr: 1, color: 'primary.main' }} />
        실시간 모니터링: {status.campaignName}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <Typography variant="h6">재고 현황</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress variant="determinate" value={stockUsagePercent} sx={{ height: 12, borderRadius: 5 }} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">{`${stockUsagePercent.toFixed(2)}%`}</Typography>
            </Box>
          </Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            {status.currentStock.toLocaleString()} / {status.totalStock.toLocaleString()}개 남음
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card sx={{ textAlign: 'center', bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography color="text.secondary">성공</Typography>
                    <Typography variant="h6">{status.successCount.toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card sx={{ textAlign: 'center', bgcolor: 'error.light' }}>
                  <CardContent>
                    <Typography color="text.secondary">실패</Typography>
                    <Typography variant="h6">{status.failCount.toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                 <Card sx={{ textAlign: 'center' }}>
                  <CardContent>
                    <Typography color="text.secondary">처리율(TPS)</Typography>
                    <Typography variant="h6">{tps.toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};


// --- 기존 통계 페이지 ---
const CampaignDetailStats = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<CampaignStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
        if (data.length > 0) {
          setSelectedCampaignId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCampaigns();
  }, []);

  const handleSearch = async () => {
    if (!selectedCampaignId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getCampaignStats(selectedCampaignId, startDate, endDate);
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '통계를 불러오는데 실패했습니다.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        캠페인 성과 분석
      </Typography>

      {/* 실시간 모니터링 섹션 */}
      {selectedCampaignId && <RealtimeMonitor campaignId={selectedCampaignId} />}

      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h5" gutterBottom>
       기간별 상세 통계
      </Typography>

      {/* 검색 조건 */}
      <Paper sx={{ p: 2, mb: 3, mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label="캠페인 선택"
              value={selectedCampaignId || ''}
              onChange={(e) => setSelectedCampaignId(Number(e.target.value))}
              size="small"
            >
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              disabled={loading || !selectedCampaignId}
            >
              조회
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {stats && !loading && (
        <>
          {/* 요약 정보 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {stats.campaignName} ({stats.startDate} ~ {stats.endDate})
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      총 참여
                    </Typography>
                    <Typography variant="h5">
                      {stats.summary.totalParticipation.toLocaleString()}건
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      성공
                    </Typography>
                    <Typography variant="h5">
                      {stats.summary.totalSuccess.toLocaleString()}건
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
                    <Typography variant="h5">
                      {stats.summary.totalFail.toLocaleString()}건
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      평균 성공률
                    </Typography>
                    <Typography variant="h5">
                      {stats.summary.averageSuccessRate}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* 일자별 추이 그래프 */}
          {stats.dailyStats.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                일자별 참여 추이
              </Typography>
              <Box sx={{ height: 400, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.dailyStats}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f44336" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f44336" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="successCount"
                      name="성공"
                      stroke="#4caf50"
                      fillOpacity={1}
                      fill="url(#colorSuccess)"
                    />
                    <Area
                      type="monotone"
                      dataKey="failCount"
                      name="실패"
                      stroke="#f44336"
                      fillOpacity={1}
                      fill="url(#colorFail)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* 성공률 추이 그래프 */}
              <Box sx={{ height: 300, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  일자별 성공률 추이
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.dailyStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="successRate"
                      name="성공률"
                      stroke="#2196f3"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}

          {/* 일자별 상세 */}
          {stats.dailyStats.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                일자별 상세
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>날짜</TableCell>
                      <TableCell align="right">성공</TableCell>
                      <TableCell align="right">실패</TableCell>
                      <TableCell align="right">합계</TableCell>
                      <TableCell align="right">성공률</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.dailyStats.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell align="right">
                          {day.successCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {day.failCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {day.totalCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <strong>{day.successRate}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {stats.dailyStats.length === 0 && (
            <Alert severity="info">해당 기간에 데이터가 없습니다.</Alert>
          )}
        </>
      )}

      {!stats && !loading && !selectedCampaignId && (
        <Alert severity="info">캠페인과 기간을 선택하고 조회 버튼을 클릭하세요.</Alert>
      )}
    </Box>
  );
};

export default CampaignDetailStats;
