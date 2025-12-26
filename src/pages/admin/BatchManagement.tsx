import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Chip,
} from '@mui/material';
import { PlayArrow, Refresh } from '@mui/icons-material';
import type { BatchHistoryResponse } from '../../types/index';
import { executeBatch, getBatchHistory } from '../../api';
import { format } from 'date-fns';

const BatchManagement = () => {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [history, setHistory] = useState<BatchHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 배치 이력 로드
  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getBatchHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // 배치 실행
  const handleExecute = async () => {
    try {
      setExecuting(true);
      setError(null);
      setSuccess(null);
      const result = await executeBatch(date);
      setSuccess(
        `배치가 시작되었습니다. Job ID: ${result.jobExecutionId}, 상태: ${result.status}`
      );
      // 이력 새로고침
      setTimeout(loadHistory, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || '배치 실행에 실패했습니다.');
    } finally {
      setExecuting(false);
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'STARTING':
      case 'STARTED':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        배치 관리
      </Typography>

      {/* 배치 실행 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          배치 실행
        </Typography>
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <TextField
            label="집계 날짜"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <Button
            variant="contained"
            startIcon={executing ? <CircularProgress size={20} /> : <PlayArrow />}
            onClick={handleExecute}
            disabled={executing}
          >
            실행
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadHistory}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>
        <Alert severity="info">매일 새벽 2시 자동 실행됩니다.</Alert>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* 실행 이력 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          실행 이력
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : history ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>날짜</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>업데이트</TableCell>
                  <TableCell>실행시간</TableCell>
                  <TableCell>종료 상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.history.map((item) => {
                  const startTime = new Date(item.startTime);
                  const endTime = new Date(item.endTime);
                  const duration = endTime.getTime() - startTime.getTime();

                  return (
                    <TableRow key={item.jobExecutionId}>
                      <TableCell>{item.jobExecutionId}</TableCell>
                      <TableCell>{item.targetDate}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {item.updatedRows ? `${item.updatedRows}개` : '-'}
                      </TableCell>
                      <TableCell>{duration}ms</TableCell>
                      <TableCell>{item.exitStatus}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">실행 이력이 없습니다.</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default BatchManagement;
