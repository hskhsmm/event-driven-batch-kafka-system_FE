import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../../api/client';
import { format, subDays } from 'date-fns';

interface DailyStats {
  date: string;
  successCount: number;
  failCount: number;
  totalCount: number;
  successRate: string;
}

const CampaignTrends = () => {
  const [campaignId, setCampaignId] = useState('1');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [campaignName, setCampaignName] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(
        `/api/admin/stats/campaign/${campaignId}?startDate=${startDate}&endDate=${endDate}`
      );

      const data = response.data.data;
      setCampaignName(data.campaignName);
      setDailyStats(data.dailyStats);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 성공률 추이 데이터
  const successRateData = dailyStats.map(stat => ({
    날짜: stat.date,
    성공률: parseFloat(stat.successRate),
  }));

  // 일자별 참여 수 데이터
  const participationData = dailyStats.map(stat => ({
    날짜: stat.date,
    성공: stat.successCount,
    실패: stat.failCount,
  }));

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        캠페인 성능 트렌드
      </Typography>

      {/* 검색 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="캠페인 ID"
              type="number"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="시작 날짜"
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
              label="종료 날짜"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              onClick={handleSearch}
              disabled={loading}
            >
              조회
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {dailyStats.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            {campaignName}
          </Typography>

          {/* 성공률 추이 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              성공률 추이
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={successRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="날짜" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="성공률"
                  stroke="#4caf50"
                  strokeWidth={2}
                  name="성공률 (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* 일자별 참여 수 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              일자별 참여 수
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={participationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="날짜" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="성공" stackId="a" fill="#4caf50" />
                <Bar dataKey="실패" stackId="a" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default CampaignTrends;
