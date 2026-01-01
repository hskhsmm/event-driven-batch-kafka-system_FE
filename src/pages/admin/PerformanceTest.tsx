import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  Chip,
} from '@mui/material';
import { Science } from '@mui/icons-material';
import { format } from 'date-fns';
import { getRawPerformanceStats, getDailyPerformanceStats } from '../../api';
import type { PerformanceStats } from '../../types';

const PerformanceTest = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawStats, setRawStats] = useState<PerformanceStats | null>(null);
  const [batchStats, setBatchStats] = useState<PerformanceStats | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setError(null);
    setRawStats(null);
    setBatchStats(null);
    try {
      const [raw, batch] = await Promise.all([
        getRawPerformanceStats(date),
        getDailyPerformanceStats(date),
      ]);
      setRawStats(raw);
      setBatchStats(batch);
    } catch (err: any) {
      setError(err.response?.data?.message || '테스트를 실행하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const improvement =
    rawStats && batchStats && batchStats.queryTimeMs > 0
      ? (rawStats.queryTimeMs / batchStats.queryTimeMs).toFixed(0)
      : 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        DB 쿼리 성능 비교
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          배치(Batch) vs 직접 쿼리(Raw) 성능 비교
        </Typography>
        <Alert severity="info" sx={{ mb: 2, mt: 2 }}>
          <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>어떤 차이가 있나요?</Typography>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            <li><Typography variant="body2"><strong>Raw Query (직접 집계):</strong> 사용자가 조회할 때마다 원본 데이터(예: 모든 참여 기록)를 실시간으로 집계합니다. 데이터가 많을수록 DB에 큰 부하를 주며 응답 시간이 길어집니다.</Typography></li>
            <li><Typography variant="body2"><strong>Batch Aggregated (배치 집계):</strong> 별도의 배치 작업이 주기적으로(예: 매일 자정) 미리 통계를 계산하여 요약 테이블에 저장해 둡니다. 사용자는 이 요약 테이블을 조회하므로, 거의 즉시 결과를 얻을 수 있으며 DB 부하가 거의 없습니다.</Typography></li>
          </ul>
        </Alert>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item>
            <TextField
              label="조회 날짜"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Science />}
              onClick={handleRunTest}
              disabled={loading}
            >
              성능 테스트 실행
            </Button>
          </Grid>
        </Grid>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

        {(rawStats || batchStats) && !loading && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>지표</TableCell>
                  <TableCell align="center">Raw Query (직접 집계)</TableCell>
                  <TableCell align="center">Batch Aggregated (배치 집계)</TableCell>
                  <TableCell align="center">개선율</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>쿼리 시간</TableCell>
                  <TableCell align="center">
                    <Chip label={`${rawStats?.queryTimeMs.toLocaleString() ?? 'N/A'} ms`} color="error" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={`${batchStats?.queryTimeMs.toLocaleString() ?? 'N/A'} ms`} color="success" />
                  </TableCell>
                  <TableCell align="center" rowSpan={2}>
                    <Typography variant="h4" color="success.main">
                      {improvement}x
                    </Typography>
                  </TableCell>
                </TableRow>
                 <TableRow>
                  <TableCell>DB 부하 (예시)</TableCell>
                  <TableCell align="center">높음 (80% CPU)</TableCell>
                  <TableCell align="center">매우 낮음 (5% CPU)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>


    </Box>
  );
};

export default PerformanceTest;
