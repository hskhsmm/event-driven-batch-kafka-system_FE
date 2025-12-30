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
        성능 비교 테스트
      </Typography>

      {/* 1. 배치 성능 비교 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          실험 1: 배치(Batch) vs 직접 쿼리(Raw) 성능 비교
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          동일한 날짜의 통계 데이터를 조회할 때, 미리 집계된 배치 테이블을 조회하는 것과 원본 테이블을 직접 조회하는 것의 속도 차이를 측정합니다.
        </Typography>
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

      {/* 2. 아키텍처 성능 비교 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          실험 2: 동기 vs 비동기(Kafka) 아키텍처 비교
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          k6와 같은 부하 테스트 도구를 사용하여 동일한 요청(10,000건)을 보냈을 때의 시스템 반응을 비교합니다. (k6 테스트 결과 기반 예시 데이터)
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>지표</TableCell>
                <TableCell align="center">동기 방식 (Sync)</TableCell>
                <TableCell align="center">비동기 방식 (Kafka)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>응답 시간 (p95)</TableCell>
                <TableCell align="center"><Chip label="3,500 ms" color="error" /></TableCell>
                <TableCell align="center"><Chip label="45 ms" color="success" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>처리량 (RPS)</TableCell>
                <TableCell align="center">~500 RPS</TableCell>
                <TableCell align="center">~3,000+ RPS</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>성공률 (10k 요청)</TableCell>
                <TableCell align="center">70% (서버 다운 발생)</TableCell>
                <TableCell align="center">100% (안정적 처리)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>재고 정확성</TableCell>
                 <TableCell align="center">❌ 실패 (초과 판매 발생)</TableCell>
                <TableCell align="center">✅ 성공 (정확히 일치)</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default PerformanceTest;
