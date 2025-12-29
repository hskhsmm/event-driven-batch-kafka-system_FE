import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { PlayArrow, Refresh, History } from '@mui/icons-material';
import {
  executeBatch,
  getBatchStatus,
  getBatchHistory,
  simulateParticipation,
} from '../../api';
import type { BatchExecution, BatchHistoryResponse } from '../../types';
import { ApiError } from '../../api/error';
import { useToast } from '../../components/ToastProvider';

const BatchManagement = () => {
  const { showToast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [runningJob, setRunningJob] = useState<BatchExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BatchHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 부하 테스트 상태
  const [simCampaignId, setSimCampaignId] = useState('');
  const [simCount, setSimCount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // 부하 테스트 핸들러
  const handleSimulate = async () => {
    const campaignIdNum = parseInt(simCampaignId, 10);
    const countNum = parseInt(simCount, 10);

    if (isNaN(campaignIdNum) || campaignIdNum <= 0) {
      setSimError('유효한 캠페인 ID를 입력하세요.');
      return;
    }
    if (isNaN(countNum) || countNum <= 0 || countNum > 100000) {
      setSimError('요청 횟수는 1 이상 100,000 이하로 입력하세요.');
      return;
    }

    setIsSimulating(true);
    setSimError(null);
    try {
      const message = await simulateParticipation(campaignIdNum, countNum);
      showToast(message, 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        setSimError(err.message);
        showToast(err.message, 'error');
      } else {
        const fallbackMsg = '알 수 없는 오류가 발생했습니다.';
        setSimError(fallbackMsg);
        showToast(fallbackMsg, 'error');
      }
    } finally {
      setIsSimulating(false);
    }
  };

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

      {/* 부하 테스트 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          부하 테스트 시뮬레이터
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          지정된 횟수만큼 참여 요청을 Kafka에 직접 발행하여 부하를 시뮬레이션합니다.
        </Typography>
        {simError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {simError}
          </Alert>
        )}
        <Box display="flex" alignItems="flex-start" gap={2}>
          <TextField
            label="캠페인 ID"
            variant="outlined"
            size="small"
            value={simCampaignId}
            onChange={(e) => setSimCampaignId(e.target.value)}
            sx={{ width: '150px' }}
          />
          <TextField
            label="요청 횟수 (최대 100,000)"
            variant="outlined"
            size="small"
            type="number"
            value={simCount}
            onChange={(e) => setSimCount(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSimulate}
            disabled={isSimulating}
            startIcon={isSimulating ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
            sx={{ height: '40px' }}
          >
            {isSimulating ? '실행 중...' : '시뮬레이션 시작'}
          </Button>
        </Box>
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
