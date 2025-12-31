import { useState } from 'react';
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
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const [virtualUsers, setVirtualUsers] = useState('100');

  const [kafkaResult, setKafkaResult] = useState<LoadTestResult | null>(null);
  const [syncResult, setSyncResult] = useState<LoadTestResult | null>(null);

  const [kafkaLoading, setKafkaLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

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
      showToast('Kafka 부하 테스트를 시작합니다...', 'info');

      const { jobId } = await executeKafkaTest({
        campaignId: parseInt(campaignId),
        virtualUsers: parseInt(virtualUsers),
        duration: 5,
      });

      pollTestResult(jobId, setKafkaResult, setKafkaLoading);

    } catch (error) {
      showToast('백엔드 API가 아직 준비되지 않았습니다. 수동 모드를 사용하세요.', 'warning');
      setKafkaLoading(false);
    }
  };

  // 자동 모드: 동기 테스트 실행
  const handleSyncTest = async () => {
    try {
      setSyncLoading(true);
      showToast('동기 방식 부하 테스트를 시작합니다...', 'info');

      const { jobId } = await executeSyncTest({
        campaignId: parseInt(campaignId),
        virtualUsers: parseInt(virtualUsers),
        duration: 5,
      });

      pollTestResult(jobId, setSyncResult, setSyncLoading);

    } catch (error) {
      showToast('백엔드 API가 아직 준비되지 않았습니다. 수동 모드를 사용하세요.', 'warning');
      setSyncLoading(false);
    }
  };

  // 결과 폴링
  const pollTestResult = (
    jobId: string,
    setResult: (result: LoadTestResult) => void,
    setLoading: (loading: boolean) => void
  ) => {
    const interval = setInterval(async () => {
      try {
        const result = await getLoadTestResult(jobId);

        if (result.status === 'COMPLETED') {
          clearInterval(interval);
          setResult(result);
          setLoading(false);
          showToast('테스트가 완료되었습니다!', 'success');
        } else if (result.status === 'FAILED') {
          clearInterval(interval);
          setLoading(false);
          showToast('테스트 실패: ' + result.error, 'error');
        }
      } catch (error) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 2000);

    setTimeout(() => clearInterval(interval), 120000);
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
          <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="가상 사용자 수"
                type="number"
                value={virtualUsers}
                onChange={(e) => setVirtualUsers(e.target.value)}
                size="small"
              />
            </Grid>
          )}
          <Grid item xs={12} sm={4}>
            {useAutoMode ? (
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={kafkaLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleKafkaTest}
                  disabled={kafkaLoading}
                  fullWidth
                >
                  Kafka
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={syncLoading ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={handleSyncTest}
                  disabled={syncLoading}
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
        </Grid>
      </Paper>

      {/* 결과 표시 */}
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

          {/* 상세 메트릭 */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Kafka 방식 결과
                </Typography>
                <MetricCard result={kafkaResult} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  동기 방식 결과
                </Typography>
                <MetricCard result={syncResult} />
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

// 메트릭 카드 컴포넌트
const MetricCard = ({ result }: { result: LoadTestResult }) => (
  <Box>
    <Typography variant="body2" color="text.secondary">응답 시간</Typography>
    <Typography>평균: {result.metrics?.avg.toFixed(2)}ms</Typography>
    <Typography>P50: {result.metrics?.p50.toFixed(2)}ms</Typography>
    <Typography>P95: {result.metrics?.p95.toFixed(2)}ms</Typography>
    <Typography>P99: {result.metrics?.p99.toFixed(2)}ms</Typography>
    <Typography>최대: {result.metrics?.max.toFixed(2)}ms</Typography>

    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>처리량</Typography>
    <Typography>총 요청: {result.metrics?.totalRequests}</Typography>
    <Typography>TPS: {result.metrics?.throughput.toFixed(2)} req/s</Typography>

    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>실패율</Typography>
    <Typography>{(result.metrics?.failureRate * 100).toFixed(2)}%</Typography>
  </Box>
);

export default LoadTestResults;
