import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
  LinearProgress,
  Chip,
} from '@mui/material';
import { PlayArrow, Speed, Timer } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import {
  executeKafkaTest,
  executeSyncTest,
  getLoadTestResult,
  type LoadTestResult,
} from '../../api/loadTest';
import { useToast } from '../../components/ToastProvider';

const LoadTestResults = () => {
  const { showToast } = useToast();

  const [useAutoMode, setUseAutoMode] = useState(false); // 자동/수동 모드 토글
  const [campaignId, setCampaignId] = useState('1');
  const [totalRequests, setTotalRequests] = useState('30000');
  const [partitions, setPartitions] = useState('3');

  const [kafkaResult, setKafkaResult] = useState<LoadTestResult | null>(null);
  const [syncResult, setSyncResult] = useState<LoadTestResult | null>(null);

  const [kafkaLoading, setKafkaLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  // 실시간 진행률 추적
  const [kafkaProgress, setKafkaProgress] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [kafkaStartTime, setKafkaStartTime] = useState<number | null>(null);
  const [syncStartTime, setSyncStartTime] = useState<number | null>(null);

  // 수동 모드: JSON 파일 로드
  const loadManualResults = async () => {
    try {
      const response = await fetch('/k6-results.json');
      const data = await response.json();

      if (data.kafka) {
        setKafkaResult({
          jobId: 'manual-kafka',
          method: 'KAFKA',
          campaignId: parseInt(campaignId),
          status: 'COMPLETED',
          metrics: data.kafka.metrics,
        });
      }

      if (data.sync) {
        setSyncResult({
          jobId: 'manual-sync',
          method: 'SYNC',
          campaignId: parseInt(campaignId),
          status: 'COMPLETED',
          metrics: data.sync.metrics,
        });
      }

      showToast('수동 테스트 결과를 불러왔습니다.', 'success');
    } catch (error) {
      showToast('k6-results.json 파일을 찾을 수 없습니다. K6 테스트를 먼저 실행하세요.', 'error');
    }
  };

  // 자동 모드: Kafka 테스트 실행
  const handleKafkaTest = async () => {
    try {
      setKafkaLoading(true);
      setKafkaProgress(0);
      setKafkaStartTime(Date.now());
      showToast('Kafka 부하 테스트를 시작합니다...', 'info');

      const { jobId } = await executeKafkaTest({
        campaignId: parseInt(campaignId),
        totalRequests: parseInt(totalRequests),
        partitions: parseInt(partitions),
      });

      pollTestResult(jobId, setKafkaResult, setKafkaLoading, setKafkaProgress);

    } catch (error) {
      showToast('백엔드 API가 아직 준비되지 않았습니다. 수동 모드를 사용하세요.', 'warning');
      setKafkaLoading(false);
      setKafkaProgress(0);
    }
  };

  // 자동 모드: 동기 테스트 실행
  const handleSyncTest = async () => {
    try {
      setSyncLoading(true);
      setSyncProgress(0);
      setSyncStartTime(Date.now());
      showToast('동기 방식 부하 테스트를 시작합니다...', 'info');

      const { jobId } = await executeSyncTest({
        campaignId: parseInt(campaignId),
        totalRequests: parseInt(totalRequests),
        partitions: parseInt(partitions),
      });

      pollTestResult(jobId, setSyncResult, setSyncLoading, setSyncProgress);

    } catch (error) {
      showToast('백엔드 API가 아직 준비되지 않았습니다. 수동 모드를 사용하세요.', 'warning');
      setSyncLoading(false);
      setSyncProgress(0);
    }
  };

  // 결과 폴링
  const pollTestResult = (
    jobId: string,
    setResult: (result: LoadTestResult) => void,
    setLoading: (loading: boolean) => void,
    setProgress: (progress: number) => void
  ) => {
    let retryCount = 0;
    const maxRetries = 150; // 2초 * 150 = 300초 (5분)
    const estimatedDuration = 40000; // K6 테스트는 약 40초 예상 (30초 실행 + 오버헤드)

    const interval = setInterval(async () => {
      try {
        const result = await getLoadTestResult(jobId);

        if (result.status === 'COMPLETED') {
          clearInterval(interval);
          setResult(result);
          setLoading(false);
          setProgress(100);
          showToast('테스트가 완료되었습니다!', 'success');
        } else if (result.status === 'FAILED') {
          clearInterval(interval);
          setLoading(false);
          setProgress(0);
          showToast('테스트 실패: ' + result.error, 'error');
        } else {
          // RUNNING: 진행률 업데이트 (추정)
          const elapsed = retryCount * 2000; // 2초마다 폴링
          const progress = Math.min((elapsed / estimatedDuration) * 100, 95); // 최대 95%까지
          setProgress(progress);
        }
      } catch (error) {
        retryCount++;
        console.warn(`폴링 에러 (${retryCount}/${maxRetries}):`, error);

        // 최대 재시도 횟수 초과 시에만 중단
        if (retryCount >= maxRetries) {
          clearInterval(interval);
          setLoading(false);
          setProgress(0);
          showToast('테스트 결과 조회 타임아웃', 'error');
        }
      }
      retryCount++;
    }, 2000);
  };

  // 비교 차트 데이터
  const comparisonData = kafkaResult?.metrics && syncResult?.metrics ? [
    { name: 'P50', Kafka: kafkaResult.metrics.p50, 동기: syncResult.metrics.p50 },
    { name: 'P95', Kafka: kafkaResult.metrics.p95, 동기: syncResult.metrics.p95 },
    { name: 'P99', Kafka: kafkaResult.metrics.p99, 동기: syncResult.metrics.p99 },
    { name: '평균', Kafka: kafkaResult.metrics.avg, 동기: syncResult.metrics.avg },
  ] : [];

  const improvement = kafkaResult?.metrics && syncResult?.metrics
    ? (syncResult.metrics.avg / kafkaResult.metrics.avg).toFixed(1)
    : 0;

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        K6 부하 테스트 결과
      </Typography>

      {/* 모드 선택 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useAutoMode}
              onChange={(e) => setUseAutoMode(e.target.checked)}
            />
          }
          label={useAutoMode ? '자동 모드 (백엔드 API)' : '수동 모드 (JSON 파일)'}
        />

        {!useAutoMode && (
          <Alert severity="info" sx={{ mt: 2 }}>
            수동 모드: K6 테스트를 직접 실행하고 결과를 <code>frontend/public/k6-results.json</code>에 저장하세요.
          </Alert>
        )}
      </Paper>

      {/* 테스트 실행 */}
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
          {useAutoMode && (
            <>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="총 요청 수"
                  type="number"
                  value={totalRequests}
                  onChange={(e) => setTotalRequests(e.target.value)}
                  size="small"
                  helperText="1000, 10000, 30000, 100000 등"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="파티션 수"
                  type="number"
                  value={partitions}
                  onChange={(e) => setPartitions(e.target.value)}
                  size="small"
                  helperText="1, 3, 10 등"
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={useAutoMode ? 3 : 4}>
            {useAutoMode ? (
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={kafkaLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleKafkaTest}
                  disabled={kafkaLoading || syncLoading}
                  fullWidth
                >
                  Kafka
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={syncLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleSyncTest}
                  disabled={kafkaLoading || syncLoading}
                  fullWidth
                >
                  동기
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={loadManualResults}
                fullWidth
              >
                결과 불러오기
              </Button>
            )}
          </Grid>

          {/* 실시간 진행률 표시 */}
          {useAutoMode && (kafkaLoading || syncLoading) && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                {kafkaLoading && (
                  <Box sx={{ mb: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="primary" fontWeight="bold">
                        <Speed fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Kafka 테스트 실행 중...
                      </Typography>
                      <Chip label={`${Math.round(kafkaProgress)}%`} color="primary" size="small" />
                    </Box>
                    <LinearProgress variant="determinate" value={kafkaProgress} />
                  </Box>
                )}
                {syncLoading && (
                  <Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="secondary" fontWeight="bold">
                        <Timer fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        동기 테스트 실행 중...
                      </Typography>
                      <Chip label={`${Math.round(syncProgress)}%`} color="secondary" size="small" />
                    </Box>
                    <LinearProgress variant="determinate" value={syncProgress} color="secondary" />
                  </Box>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* 비교 결과 (둘 다 있을 때만) */}
      {kafkaResult?.metrics && syncResult?.metrics && (
        <>
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
            <Typography variant="h5" gutterBottom>
              🚀 Kafka가 {improvement}배 빠름!
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              응답 시간 비교 (ms)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Kafka" fill="#4caf50" />
                <Bar dataKey="동기" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      {/* 개별 결과 표시 */}
      {(kafkaResult?.metrics || syncResult?.metrics) && (
        <Grid container spacing={3}>
          {kafkaResult?.metrics && (
            <Grid item xs={12} md={kafkaResult?.metrics && syncResult?.metrics ? 6 : 12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Kafka 방식 결과
                </Typography>
                <MetricCard result={kafkaResult} />
              </Paper>
            </Grid>
          )}
          {syncResult?.metrics && (
            <Grid item xs={12} md={kafkaResult?.metrics && syncResult?.metrics ? 6 : 12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  동기 방식 결과
                </Typography>
                <MetricCard result={syncResult} />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
};

// 숫자 애니메이션 컴포넌트
const AnimatedNumber = ({ value, decimals = 2, suffix = '' }: { value: number; decimals?: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000; // 1초
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue.toFixed(decimals)}{suffix}</span>;
};

// 메트릭 카드 컴포넌트
const MetricCard = ({ result }: { result: LoadTestResult }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return (
    <Box sx={{ opacity: show ? 1 : 0, transition: 'opacity 0.5s' }}>
      <Typography variant="body2" color="text.secondary">응답 시간</Typography>
      <Typography>
        평균: <AnimatedNumber value={result.metrics?.avg ?? 0} />ms
      </Typography>
      <Typography>
        P50: <AnimatedNumber value={result.metrics?.p50 ?? 0} />ms
      </Typography>
      <Typography>
        P95: <AnimatedNumber value={result.metrics?.p95 ?? 0} />ms
      </Typography>
      <Typography>
        P99: <AnimatedNumber value={result.metrics?.p99 ?? 0} />ms
      </Typography>
      <Typography>
        최대: <AnimatedNumber value={result.metrics?.max ?? 0} />ms
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>처리량</Typography>
      <Typography>
        총 요청: <AnimatedNumber value={result.metrics?.totalRequests ?? 0} decimals={0} />
      </Typography>
      <Typography>
        TPS: <AnimatedNumber value={result.metrics?.throughput ?? 0} suffix=" req/s" />
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>실패율</Typography>
      <Typography>
        <AnimatedNumber value={(result.metrics?.failureRate ?? 0) * 100} suffix="%" />
      </Typography>
    </Box>
  );
};

export default LoadTestResults;
