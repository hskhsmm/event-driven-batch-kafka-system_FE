import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search, Timeline } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import type { DailyStatsResponse } from '../../types/index';
import { getDailyStats } from '../../api';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const StatsDashboard = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<DailyStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 통계 조회
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDailyStats(date);
      console.log('StatsDashboard - 받은 데이터:', data);
      console.log('StatsDashboard - summary:', data?.summary);
      console.log('StatsDashboard - campaigns:', data?.campaigns);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          통계 대시보드
        </Typography>
        <Button
          variant="outlined"
          component={Link}
          to="/admin/stats/detail"
          startIcon={<Timeline />}
        >
          캠페인별 상세 통계
        </Button>
      </Box>

      {/* 날짜 선택 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="날짜 선택"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearch}
            disabled={loading}
          >
            조회
          </Button>
        </Box>
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
          {/* 전체 요약 */}
          {stats.summary ? (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                전체 요약 ({stats.date})
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        총 캠페인
                      </Typography>
                      <Typography variant="h5">
                        {stats.summary.totalCampaigns}개
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
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
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography color="text.secondary" gutterBottom>
                        전체 성공률
                      </Typography>
                      <Typography variant="h4">
                        {stats.summary.overallSuccessRate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              {stats.message || '해당 날짜의 집계 데이터가 없습니다.'}
            </Alert>
          )}

          {/* 캠페인별 상세 */}
          {stats.campaigns && stats.campaigns.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                캠페인별 상세
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>캠페인명</TableCell>
                      <TableCell align="right">성공</TableCell>
                      <TableCell align="right">실패</TableCell>
                      <TableCell align="right">합계</TableCell>
                      <TableCell align="right">성공률</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.campaigns.map((campaign) => (
                      <TableRow key={campaign.campaignId}>
                        <TableCell>{campaign.campaignName}</TableCell>
                        <TableCell align="right">
                          {campaign.successCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {campaign.failCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {campaign.totalCount.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <strong>{campaign.successRate}</strong>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 캠페인별 비교 차트 */}
              <Box sx={{ mt: 4, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  캠페인별 성공/실패 비교
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.campaigns.map((c) => ({
                      name: c.campaignName,
                      성공: c.successCount,
                      실패: c.failCount,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="성공" fill="#4caf50" />
                    <Bar dataKey="실패" fill="#f44336" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          )}
        </>
      )}

      {!stats && !loading && (
        <Alert severity="info">날짜를 선택하고 조회 버튼을 클릭하세요.</Alert>
      )}
    </Box>
  );
};

export default StatsDashboard;
