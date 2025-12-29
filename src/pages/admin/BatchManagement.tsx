import { useState, useEffect, useRef } from 'react';
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
  LinearProgress,
} from '@mui/material';
import { PlayArrow, Refresh, History } from '@mui/icons-material';
import {
  executeBatch,
  getBatchStatus,
  getBatchHistory,
  simulateParticipation,
  getDailyStats,
  getCampaigns,
} from '../../api';
import type { BatchExecution, BatchHistoryResponse } from '../../types';
import { ApiError } from '../../api/error';
import { useToast } from '../../components/ToastProvider';
import { format } from 'date-fns';

const BatchManagement = () => {
  const { showToast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [executing, setExecuting] = useState(false);
  const [runningJob, setRunningJob] = useState<BatchExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BatchHistoryResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 부하 테스트 상태
  const [simCampaignId, setSimCampaignId] = useState('');
  const [simCount, setSimCount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simProgress, setSimProgress] = useState(0);
  const [simResult, setSimResult] = useState<{ success: number; fail: number } | null>(null);
  const [pollIntervalId, setPollIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 로그 추가 함수
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 자동 스크롤
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 시뮬레이션 상태 저장
  const saveSimulationState = (campaignId: number, count: number, initialStock: number, initialSuccess: number, initialFail: number) => {
    localStorage.setItem('simulation', JSON.stringify({
      campaignId,
      count,
      initialStock,
      initialSuccess,
      initialFail,
      startTime: Date.now(),
    }));
  };

  // 시뮬레이션 상태 정리
  const clearSimulationState = () => {
    localStorage.removeItem('simulation');
    if (pollIntervalId) {
      clearInterval(pollIntervalId);
      setPollIntervalId(null);
    }
  };

  // 진행 상황 polling 시작 (재고 기반)
  const startPolling = (campaignId: number, count: number, initialStock: number, initialSuccess: number, initialFail: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const campaigns = await getCampaigns();
        const campaign = campaigns?.find(c => c.id === campaignId);

        if (campaign) {
          const stockDecreased = initialStock - campaign.currentStock;
          const isStockExhausted = campaign.currentStock === 0;

          // 성공/실패 계산
          const processedSuccess = Math.min(stockDecreased, initialStock);
          const processedFail = isStockExhausted ? Math.max(0, count - initialStock) : 0;
          const totalProcessed = processedSuccess + processedFail;
          const progress = Math.min((totalProcessed / count) * 100, 100);

          addLog(`재고: ${campaign.currentStock}/${campaign.totalStock} | 처리: ${totalProcessed}/${count} (성공: ${processedSuccess}, 실패: ${processedFail}) ${progress.toFixed(1)}%`);
          setSimProgress(progress);

          // 완료 조건: 재고 소진 또는 목표 달성
          if (stockDecreased >= count || isStockExhausted) {
            clearInterval(pollInterval);
            setPollIntervalId(null);

            addLog(`✅ 시뮬레이션 완료! 총 ${totalProcessed}건 처리`);
            addLog(`📊 최종 결과 - 성공: ${processedSuccess}건, 실패: ${processedFail}건`);

            setSimResult({
              success: processedSuccess,
              fail: processedFail,
            });
            setIsSimulating(false);
            clearSimulationState();
            showToast('시뮬레이션이 완료되었습니다.', 'success');
          }
        }
      } catch (err) {
        addLog(`❌ 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      }
    }, 1000);

    setPollIntervalId(pollInterval);

    // 최대 120초 타임아웃
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollIntervalId(null);
      setIsSimulating(false);
      clearSimulationState();
    }, 120000);
  };

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
    setSimProgress(0);
    setSimResult(null);
    setLogs([]);

    try {
      addLog(`🚀 시뮬레이션 시작 - 캠페인 ID: ${campaignIdNum}, 요청 건수: ${countNum}`);

      // 시작 전 캠페인 재고 및 통계 조회
      const campaigns = await getCampaigns();
      const campaign = campaigns?.find(c => c.id === campaignIdNum);

      if (!campaign) {
        throw new Error('캠페인을 찾을 수 없습니다.');
      }

      const initialStock = campaign.currentStock;
      addLog(`📦 현재 재고: ${initialStock}/${campaign.totalStock}`);

      // 시작 전 통계 조회
      const today = format(new Date(), 'yyyy-MM-dd');
      const initialStats = await getDailyStats(today).catch(() => null);
      const campaignStats = initialStats?.campaigns?.find(c => c.campaignId === campaignIdNum);
      const initialSuccess = campaignStats?.successCount || 0;
      const initialFail = campaignStats?.failCount || 0;

      addLog(`📊 시작 전 통계 - 성공: ${initialSuccess}, 실패: ${initialFail}`);

      // 시뮬레이션 시작
      const message = await simulateParticipation(campaignIdNum, countNum);
      addLog(`✔️ ${message}`);
      showToast(message, 'success');
      addLog(`⏱️ 처리 진행 상황 모니터링 시작...`);

      // 상태 저장
      saveSimulationState(campaignIdNum, countNum, initialStock, initialSuccess, initialFail);

      // Polling 시작
      startPolling(campaignIdNum, countNum, initialStock, initialSuccess, initialFail);

    } catch (err) {
      setIsSimulating(false);
      clearSimulationState();
      if (err instanceof ApiError) {
        setSimError(err.message);
        showToast(err.message, 'error');
      } else {
        const fallbackMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
        setSimError(fallbackMsg);
        showToast(fallbackMsg, 'error');
      }
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

    // 저장된 시뮬레이션 상태 복원
    const savedSimulation = localStorage.getItem('simulation');
    if (savedSimulation) {
      try {
        const { campaignId, count, initialStock, initialSuccess, initialFail, startTime } = JSON.parse(savedSimulation);

        // 2분 이상 경과했으면 무시
        if (Date.now() - startTime < 120000) {
          setSimCampaignId(campaignId.toString());
          setSimCount(count.toString());
          setIsSimulating(true);
          setSimProgress(0);
          startPolling(campaignId, count, initialStock, initialSuccess, initialFail);
          console.log('시뮬레이션 상태 복원:', { campaignId, count, initialStock, initialSuccess, initialFail });
        } else {
          clearSimulationState();
        }
      } catch (err) {
        console.error('시뮬레이션 상태 복원 실패:', err);
        clearSimulationState();
      }
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
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
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
      console.error(err);
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
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <TextField
            label="캠페인 ID"
            variant="outlined"
            size="small"
            value={simCampaignId}
            onChange={(e) => setSimCampaignId(e.target.value)}
            sx={{ width: '150px' }}
            disabled={isSimulating}
          />
          <TextField
            label="요청 횟수 (최대 100,000)"
            variant="outlined"
            size="small"
            type="number"
            value={simCount}
            onChange={(e) => setSimCount(e.target.value)}
            sx={{ flexGrow: 1 }}
            disabled={isSimulating}
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

        {/* 진행률 표시 */}
        {isSimulating && (
          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                진행 상황
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {simProgress.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={simProgress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* 실시간 로그 뷰어 */}
        {(isSimulating || logs.length > 0) && (
          <Paper
            ref={logContainerRef}
            sx={{
              p: 2,
              mb: 2,
              bgcolor: '#1e1e1e',
              maxHeight: 300,
              overflow: 'auto',
              border: '1px solid #444',
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.85rem',
                margin: 0,
                color: '#d4d4d4',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </Typography>
          </Paper>
        )}

        {/* 결과 요약 */}
        {simResult && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              시뮬레이션 완료
            </Typography>
            <Typography variant="body2">
              성공: {simResult.success.toLocaleString()}건 |
              실패: {simResult.fail.toLocaleString()}건 |
              성공률: {((simResult.success / (simResult.success + simResult.fail)) * 100).toFixed(2)}%
            </Typography>
          </Alert>
        )}
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
