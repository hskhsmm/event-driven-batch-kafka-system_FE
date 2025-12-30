import { useState, useEffect } from 'react';
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
import type { PerformanceStats } from '../../types/index';
import { getDailyPerformanceStats } from '../../api';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#4caf50', '#f44336']; // 초록(성공), 빨강(실패)

const StatsDashboard = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDailyPerformanceStats(date);
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '통계를 불러오는데 실패했습니다.');
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 오늘 날짜 통계 자동 조회
  useEffect(() => {
    handleSearch();
  }, []);

  const pieChartData = stats?.summary
    ? [
        { name: '성공', value: stats.summary.totalSuccess },
        { name: '실패', value: stats.summary.totalFail },
      ]
    : [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          일별 통계 대시보드
        </Typography>
        <Button
          variant="outlined"
          component={Link}
          to="/admin/campaigns"
        >
          캠페인 상세/실시간
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={6}>
                       <Card>
                        <CardContent>
                          <Typography color="text.secondary" gutterBottom>총 참여</Typography>
                          <Typography variant="h5">{stats.summary.totalParticipation.toLocaleString()}건</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                     <Grid item xs={6} sm={6}>
                      <Card>
                        <CardContent>
                          <Typography color="text.secondary" gutterBottom>총 캠페인</Typography>
                          <Typography variant="h5">{stats.summary.totalCampaigns}개</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <Card sx={{ bgcolor: 'success.light' }}>
                        <CardContent>
                          <Typography color="text.secondary" gutterBottom>총 성공</Typography>
                          <Typography variant="h5">{stats.summary.totalSuccess.toLocaleString()}건</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={6}>
                       <Card sx={{ bgcolor: 'error.light' }}>
                        <CardContent>
                          <Typography color="text.secondary" gutterBottom>총 실패</Typography>
                          <Typography variant="h5">{stats.summary.totalFail.toLocaleString()}건</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={5}>
                   <Typography variant="subtitle1" align="center" gutterBottom>전체 성공률: <strong>{stats.summary.overallSuccessRate}</strong></Typography>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              해당 날짜의 집계 데이터가 없습니다.
            </Alert>
          )}

          {/* 캠페인별 상세 */}
          {stats.campaigns && stats.campaigns.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                캠페인별 상세
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>캠페인명</TableCell>
                          <TableCell align="right">성공</TableCell>
                          <TableCell align="right">실패</TableCell>
                          <TableCell align="right">성공률</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.campaigns.map((campaign) => (
                          <TableRow key={campaign.campaignId}>
                            <TableCell>{campaign.campaignName}</TableCell>
                            <TableCell align="right">{campaign.successCount.toLocaleString()}</TableCell>
                            <TableCell align="right">{campaign.failCount.toLocaleString()}</TableCell>
                            <TableCell align="right"><strong>{campaign.successRate}</strong></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stats.campaigns.map((c) => ({
                        name: c.campaignName,
                        성공: c.successCount,
                        실패: c.failCount,
                      }))}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="성공" stackId="a" fill="#4caf50" />
                      <Bar dataKey="실패" stackId="a" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
              </Grid>
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
