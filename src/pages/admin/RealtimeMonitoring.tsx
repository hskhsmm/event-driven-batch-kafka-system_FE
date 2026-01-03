import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { PlayArrow, Stop, Help } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getCampaignRealtimeStatus } from '../../api/campaigns';
import { getRecentLogs } from '../../api/logs';
import type { LogEntry } from '../../types';

interface CampaignStatus {
  campaignId: number;
  campaignName: string;
  totalStock: number;
  currentStock: number;
  successCount: number;
  failCount: number;
  totalParticipation: number;
  stockUsageRate: string;
}

interface TPSDataPoint {
  time: string;
  tps: number;
  successCount: number;
  failCount: number;
}

interface FinalMetrics {
  campaignId: number;
  campaignName: string;
  totalProcessed: number;
  successCount: number;
  failCount: number;
  averageTps: number;
  peakTps: number;
  actualTps: number;
  avgLatencyMs: number;
  duration: number;
  timestamp: string;
}

const RealtimeMonitoring = () => {
  const [campaignId, setCampaignId] = useState('1');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState<CampaignStatus | null>(null);
  const [tpsHistory, setTpsHistory] = useState<TPSDataPoint[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);

  // 이전 재고 추적 (TPS 계산용)
  const [prevStock, setPrevStock] = useState<number | null>(null);
  const [prevTime, setPrevTime] = useState<number | null>(null);

  // 최종 요약 지표
  const [finalMetrics, setFinalMetrics] = useState<FinalMetrics | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [initialStatus, setInitialStatus] = useState<CampaignStatus | null>(null);

  // 지표 설명 모달
  const [explanationOpen, setExplanationOpen] = useState(false);

  // 처리 로그
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // 폴링
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      try {
        const newStatus = await getCampaignRealtimeStatus(parseInt(campaignId));

        setStatus(newStatus);

        // TPS 계산
        if (prevStock !== null && prevTime !== null) {
          const stockChange = prevStock - newStatus.currentStock;
          const timeElapsed = (Date.now() - prevTime) / 1000; // 초 단위

          const tps = stockChange / timeElapsed;
          setCurrentTPS(Math.max(0, tps));

          // 히스토리 추가
          const now = new Date();
          const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false });

          setTpsHistory(prev => {
            const updated = [...prev, {
              time: timeStr,
              tps: Math.max(0, tps),
              successCount: newStatus.successCount,
              failCount: newStatus.failCount,
            }];

            // 최근 60개만 유지 (1분간)
            return updated.slice(-60);
          });
        }

        setPrevStock(newStatus.currentStock);
        setPrevTime(Date.now());

      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring, campaignId, prevStock, prevTime]);

  // 로그 폴링 (5초마다)
  useEffect(() => {
    if (!isMonitoring) return;

    const fetchLogs = async () => {
      try {
        const recentLogs = await getRecentLogs(100);
        setLogs(recentLogs);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    // 초기 로드
    fetchLogs();

    // 5초마다 갱신
    const interval = setInterval(fetchLogs, 5000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleStart = async () => {
    setIsMonitoring(true);
    setTpsHistory([]);
    setPrevStock(null);
    setPrevTime(null);
    setStartTime(Date.now());
    setFinalMetrics(null);

    // 초기 상태 저장
    try {
      const initialState = await getCampaignRealtimeStatus(parseInt(campaignId));
      setInitialStatus(initialState);
    } catch (error) {
      console.error('Failed to get initial status:', error);
    }
  };

  const handleStop = () => {
    setIsMonitoring(false);

    // 최종 지표 계산 및 저장
    if (status && startTime && initialStatus) {
      const duration = (Date.now() - startTime) / 1000; // 초 단위
      const totalProcessed = status.totalParticipation - initialStatus.totalParticipation;
      const successDiff = status.successCount - initialStatus.successCount;
      const failDiff = status.failCount - initialStatus.failCount;

      // 평균 TPS 계산
      const averageTps = duration > 0 ? totalProcessed / duration : 0;

      // 최고 TPS (히스토리에서)
      const peakTps = tpsHistory.length > 0
        ? Math.max(...tpsHistory.map(h => h.tps))
        : currentTPS;

      const final: FinalMetrics = {
        campaignId: status.campaignId,
        campaignName: status.campaignName,
        totalProcessed,
        successCount: successDiff,
        failCount: failDiff,
        averageTps: Math.round(averageTps * 100) / 100,
        peakTps: Math.round(peakTps * 100) / 100,
        actualTps: status.processingMetrics?.actualTps || 0,
        avgLatencyMs: status.processingMetrics?.avgLatencyMs || 0,
        duration: Math.round(duration),
        timestamp: new Date().toLocaleString('ko-KR'),
      };

      setFinalMetrics(final);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="h4">
          실시간 모니터링 대시보드
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Help />}
          onClick={() => setExplanationOpen(true)}
          size="small"
        >
          지표 설명
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold' }}>페이지 설명</Typography>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li><Typography variant="body2">이 대시보드는 선택된 캠페인의 진행 상황을 <strong>1초 간격</strong>으로 조회하여 실시간으로 보여줍니다.</Typography></li>
          <li><Typography variant="body2"><strong>TPS (Transaction Per Second)</strong>는 1초당 처리된 참여 요청 수를 의미합니다.</Typography></li>
          <li><Typography variant="body2">차트에는 최근 <strong>60개</strong>의 데이터만 표시하여 현재 추이를 집중적으로 보여줍니다 (Rolling Window).</Typography></li>
        </ul>
      </Alert>

      {/* 컨트롤 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="캠페인 ID"
            type="number"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            size="small"
            disabled={isMonitoring}
          />
          {!isMonitoring ? (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStart}
            >
              모니터링 시작
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={handleStop}
            >
              중지
            </Button>
          )}
        </Box>
      </Paper>

      {status && (
        <>
          {/* 현재 TPS */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
            <Typography variant="h6">현재 TPS (Transactions Per Second)</Typography>
            <Typography variant="h2">{currentTPS.toFixed(2)} req/s</Typography>
          </Paper>

          {/* 메트릭 카드 */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    재고 현황
                  </Typography>
                  <Typography variant="h4">
                    {status.currentStock} / {status.totalStock}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(status.stockUsageRate)}
                    sx={{ mt: 2 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    성공
                  </Typography>
                  <Typography variant="h4">
                    {status.successCount.toLocaleString()}
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
                  <Typography variant="h4">
                    {status.failCount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    성공률
                  </Typography>
                  <Typography variant="h4">
                    {status.totalParticipation > 0
                      ? ((status.successCount / status.totalParticipation) * 100).toFixed(1)
                      : 0}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 실제 처리 성능 지표 */}
          {status.processingMetrics && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
                  ⚡ 실제 처리 성능 (최근 5초)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ bgcolor: 'info.light' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      실제 처리 TPS
                    </Typography>
                    <Typography variant="h4">
                      {status.processingMetrics.actualTps.toFixed(2)} msg/s
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      메시지 처리 속도 (Kafka → DB)
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ bgcolor: 'warning.light' }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      평균 처리 지연시간
                    </Typography>
                    <Typography variant="h4">
                      {status.processingMetrics.avgLatencyMs.toFixed(2)} ms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Kafka 메시지 → DB 저장
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      최근 처리 메시지
                    </Typography>
                    <Typography variant="h4">
                      {status.processingMetrics.recentProcessed} 개
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      최근 5초간 처리된 메시지
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* TPS 그래프 */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              TPS 추이 (실시간)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={tpsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tps"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  name="TPS"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      {/* 최종 요약 지표 */}
      {finalMetrics && (
        <>
          <Alert severity="success" sx={{ my: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 테스트 완료 - 최종 요약 지표
            </Typography>
            <Typography variant="body2">
              캠페인: {finalMetrics.campaignName} | 종료 시각: {finalMetrics.timestamp}
            </Typography>
          </Alert>

          <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
            <Grid container spacing={3}>
              {/* 테스트 기간 */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  테스트 기간
                </Typography>
                <Typography variant="h4">
                  {finalMetrics.duration}초
                </Typography>
              </Grid>

              {/* 총 처리량 */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  총 처리량
                </Typography>
                <Typography variant="h4">
                  {finalMetrics.totalProcessed.toLocaleString()}개
                </Typography>
              </Grid>

              {/* 평균 TPS */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  평균 TPS (재고 기반)
                </Typography>
                <Typography variant="h4">
                  {finalMetrics.averageTps.toFixed(2)} req/s
                </Typography>
              </Grid>

              {/* 최고 TPS */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  최고 TPS
                </Typography>
                <Typography variant="h4">
                  {finalMetrics.peakTps.toFixed(2)} req/s
                </Typography>
              </Grid>

              {/* 성공/실패 */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  성공 처리
                </Typography>
                <Typography variant="h4" color="success.main">
                  {finalMetrics.successCount.toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  실패 처리
                </Typography>
                <Typography variant="h4" color="error.main">
                  {finalMetrics.failCount.toLocaleString()}
                </Typography>
              </Grid>

              {/* 실제 처리 TPS */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  실제 처리 TPS
                </Typography>
                <Typography variant="h4" color="info.main">
                  {finalMetrics.actualTps.toFixed(2)} msg/s
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (마지막 5초 평균)
                </Typography>
              </Grid>

              {/* 평균 지연시간 */}
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  평균 처리 지연
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {finalMetrics.avgLatencyMs.toFixed(2)} ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  (Kafka → DB)
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Alert severity="info">
            <Typography variant="body2">
              <strong>💡 요약:</strong> {finalMetrics.duration}초 동안 총 {finalMetrics.totalProcessed.toLocaleString()}개의 메시지를 처리했습니다.
              평균 TPS는 {finalMetrics.averageTps.toFixed(2)} req/s이며, 최고 {finalMetrics.peakTps.toFixed(2)} req/s까지 도달했습니다.
              실제 메시지 처리 속도는 {finalMetrics.actualTps.toFixed(2)} msg/s이고, 평균 처리 지연시간은 {finalMetrics.avgLatencyMs.toFixed(2)}ms입니다.
            </Typography>
          </Alert>
        </>
      )}

      {/* 지표 설명 모달 */}
      <Dialog
        open={explanationOpen}
        onClose={() => setExplanationOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📊 실시간 모니터링 지표 설명
        </DialogTitle>
        <DialogContent dividers>
          {/* 1. 현재 TPS (재고 기반) */}
          <Typography variant="h6" color="primary" gutterBottom>
            1. 현재 TPS (Transactions Per Second) - 재고 기반
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>정의:</strong> 1초당 처리된 참여 요청 수를 재고 감소량으로 계산한 지표입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>계산 로직:</strong>
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
{`// 프론트엔드: RealtimeMonitoring.tsx (78-83행)
const stockChange = prevStock - newStatus.currentStock;
const timeElapsed = (Date.now() - prevTime) / 1000; // 초 단위
const tps = stockChange / timeElapsed;
setCurrentTPS(Math.max(0, tps));`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>데이터 출처:</strong> 백엔드 API <code>GET /api/campaigns/{`{id}`}/status</code>에서 <code>currentStock</code> 값을 1초마다 폴링하여 이전 값과 비교합니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>신뢰성:</strong> Campaign 테이블의 <code>current_stock</code> 컬럼은 데이터베이스 원자적 연산(Atomic UPDATE)으로 감소되므로 정확합니다.
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
{`// 백엔드: CampaignRepository.java
UPDATE Campaign c SET c.currentStock = c.currentStock - 1
WHERE c.id = :id AND c.currentStock > 0`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            이 쿼리는 재고 확인과 감소를 하나의 SQL로 처리하며, 데이터베이스의 행 수준 잠금(Row-level locking)을 통해 동시성을 보장합니다.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 2. TPS 추이 그래프 */}
          <Typography variant="h6" color="primary" gutterBottom>
            2. TPS 추이 그래프 (Rolling Window)
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>정의:</strong> 시간에 따른 TPS 변화를 실시간으로 보여주는 라인 차트입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>계산 로직:</strong>
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
{`// 프론트엔드: RealtimeMonitoring.tsx (89-99행)
setTpsHistory(prev => {
  const updated = [...prev, {
    time: timeStr,
    tps: Math.max(0, tps),
    successCount: newStatus.successCount,
    failCount: newStatus.failCount,
  }];

  // 최근 60개만 유지 (1분간)
  return updated.slice(-60);
});`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>Rolling Window 개념:</strong> 매 초마다 새 데이터가 추가되고, 60개(1분)를 초과하면 가장 오래된 데이터가 제거됩니다. 이를 통해 최근 1분간의 추이만 집중적으로 볼 수 있습니다.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 3. 실제 처리 TPS */}
          <Typography variant="h6" color="primary" gutterBottom>
            3. 실제 처리 TPS (메시지 처리 속도) - DB 기반
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>정의:</strong> Kafka Consumer가 메시지를 받아 DB에 저장하는 실제 처리 속도를 측정한 지표입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>계산 로직 (백엔드):</strong>
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
{`// 백엔드: ParticipationController.java (119-128행)
LocalDateTime since = LocalDateTime.now().minusSeconds(5);
List<ParticipationHistory> recentRecords =
    participationHistoryRepository
        .findByCampaignIdAndCreatedAtAfterOrderByCreatedAtAsc(id, since);

LocalDateTime firstProcessed = recentRecords.get(0).getCreatedAt();
LocalDateTime lastProcessed = recentRecords.get(recentRecords.size() - 1).getCreatedAt();
long durationSeconds = Duration.between(firstProcessed, lastProcessed).getSeconds();
double actualTps = durationSeconds > 0 ? (double) recentRecords.size() / durationSeconds : 0;`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>데이터 출처:</strong> <code>participation_history</code> 테이블에서 최근 5초간 생성된 레코드를 조회합니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>DB 쿼리:</strong>
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
{`SELECT * FROM participation_history
WHERE campaign_id = ? AND created_at > NOW() - INTERVAL 5 SECOND
ORDER BY created_at ASC;`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>재고 기반 TPS와의 차이:</strong> 재고 기반 TPS는 요청 속도를 측정하지만, 실제 처리 TPS는 Kafka → Consumer → DB까지의 전체 파이프라인 처리 속도를 측정합니다.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 4. 평균 처리 지연시간 */}
          <Typography variant="h6" color="primary" gutterBottom>
            4. 평균 처리 지연시간 (Kafka → DB)
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>정의:</strong> Kafka 메시지가 생성된 시점부터 DB에 저장되기까지 걸린 평균 시간(밀리초)입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>계산 로직 (백엔드):</strong>
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
{`// 백엔드: ParticipationController.java (131-140행)
double avgLatencyMs = recentRecords.stream()
    .filter(r -> r.getKafkaTimestamp() != null)
    .mapToLong(r -> {
        LocalDateTime kafkaTime = Instant.ofEpochMilli(r.getKafkaTimestamp())
                .atZone(ZoneId.of("Asia/Seoul"))
                .toLocalDateTime();
        return Duration.between(kafkaTime, r.getCreatedAt()).toMillis();
    })
    .average()
    .orElse(0.0);`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>데이터 출처:</strong> <code>participation_history</code> 테이블의 <code>kafka_timestamp</code>(메시지 생성 시간)와 <code>created_at</code>(DB 저장 시간)을 비교합니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>신뢰성:</strong> Consumer에서 메시지를 받을 때 Kafka 메타데이터의 timestamp를 함께 저장하므로 정확한 지연시간 측정이 가능합니다.
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 5. 최근 처리 메시지 */}
          <Typography variant="h6" color="primary" gutterBottom>
            5. 최근 처리 메시지 (5초 Rolling Window)
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>정의:</strong> 최근 5초간 DB에 저장된 메시지 개수입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>계산 로직:</strong> 위의 실제 처리 TPS 계산에 사용된 동일한 쿼리 결과의 레코드 개수(<code>recentRecords.size()</code>)입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>성공 처리와의 차이:</strong>
          </Typography>
          <ul style={{ marginLeft: 20 }}>
            <li><Typography variant="body2"><strong>성공 처리 (Success Count):</strong> 캠페인 시작부터 현재까지의 누적 성공 건수</Typography></li>
            <li><Typography variant="body2"><strong>최근 처리 메시지:</strong> 최근 5초간만의 처리 건수 (성공+실패 포함)</Typography></li>
          </ul>
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            <strong>Rolling Window:</strong> 매 초마다 기준 시점이 변경되어 항상 "현재 - 5초"부터 "현재"까지의 데이터만 조회합니다.
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
{`예시:
10초: [5초~10초] 구간의 메시지 = 120개
11초: [6초~11초] 구간의 메시지 = 135개
12초: [7초~12초] 구간의 메시지 = 150개`}
            </Typography>
          </Paper>

          <Divider sx={{ my: 3 }} />

          {/* 6. 최종 요약 지표 */}
          <Typography variant="h6" color="primary" gutterBottom>
            6. 최종 요약 지표 (테스트 완료 후)
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>정의:</strong> "중지" 버튼을 누르면 모니터링 시작부터 종료까지의 전체 성능을 요약한 지표입니다.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>계산 로직:</strong>
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.100', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
{`// 프론트엔드: RealtimeMonitoring.tsx (134-160행)
const duration = (Date.now() - startTime) / 1000; // 초 단위
const totalProcessed = status.totalParticipation - initialStatus.totalParticipation;
const successDiff = status.successCount - initialStatus.successCount;
const failDiff = status.failCount - initialStatus.failCount;

// 평균 TPS 계산
const averageTps = duration > 0 ? totalProcessed / duration : 0;

// 최고 TPS (히스토리에서)
const peakTps = tpsHistory.length > 0
  ? Math.max(...tpsHistory.map(h => h.tps))
  : currentTPS;`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>주요 지표:</strong>
          </Typography>
          <ul style={{ marginLeft: 20 }}>
            <li><Typography variant="body2"><strong>테스트 기간:</strong> 시작 시간과 종료 시간의 차이</Typography></li>
            <li><Typography variant="body2"><strong>총 처리량:</strong> 종료 시점 totalParticipation - 시작 시점 totalParticipation</Typography></li>
            <li><Typography variant="body2"><strong>평균 TPS:</strong> 총 처리량 ÷ 테스트 기간</Typography></li>
            <li><Typography variant="body2"><strong>최고 TPS:</strong> TPS 히스토리에서 최댓값</Typography></li>
            <li><Typography variant="body2"><strong>실제 처리 TPS:</strong> 마지막 5초 평균 (종료 시점 스냅샷)</Typography></li>
            <li><Typography variant="body2"><strong>평균 처리 지연:</strong> 마지막 5초 평균 (종료 시점 스냅샷)</Typography></li>
          </ul>

          <Divider sx={{ my: 3 }} />

          {/* 7. Kafka 메시지 흐름 */}
          <Typography variant="h6" color="primary" gutterBottom>
            7. Kafka 메시지 처리 흐름
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'info.light', mb: 2 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
{`[HTTP 요청] → [ParticipationController]
    → [Kafka Producer] → [Kafka Topic: participation-events]
    → [Kafka Consumer] → [ParticipationEventConsumer]
    → [DB 원자적 UPDATE로 재고 감소]
    → [ParticipationHistory DB 저장]
    → [kafka_timestamp, created_at 기록]`}
            </Typography>
          </Paper>
          <Typography variant="body2" paragraph>
            <strong>핵심 원리:</strong>
          </Typography>
          <ul style={{ marginLeft: 20 }}>
            <li><Typography variant="body2">비동기 처리로 HTTP 응답은 즉시 반환됩니다.</Typography></li>
            <li><Typography variant="body2">Kafka는 메시지 큐 역할을 하며 순서를 보장합니다.</Typography></li>
            <li><Typography variant="body2">Consumer가 메시지를 받아 실제 재고 감소 및 DB 저장을 처리합니다.</Typography></li>
            <li><Typography variant="body2">모든 타임스탬프가 DB에 기록되어 정확한 성능 측정이 가능합니다.</Typography></li>
          </ul>

          <Divider sx={{ my: 3 }} />

          {/* 8. 신뢰성 보장 */}
          <Typography variant="h6" color="primary" gutterBottom>
            8. 데이터 신뢰성 보장
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>모든 지표는 다음과 같은 방법으로 신뢰성을 보장합니다:</strong>
          </Typography>
          <ul style={{ marginLeft: 20 }}>
            <li><Typography variant="body2"><strong>원자성:</strong> 데이터베이스 원자적 UPDATE 쿼리로 재고 감소 시 동시성 문제 방지</Typography></li>
            <li><Typography variant="body2"><strong>정확한 타임스탬프:</strong> Kafka 메시지 생성 시점과 DB 저장 시점을 모두 기록</Typography></li>
            <li><Typography variant="body2"><strong>실시간 집계:</strong> 배치가 아닌 실제 participation_history 테이블 조회</Typography></li>
            <li><Typography variant="body2"><strong>코드 투명성:</strong> 모든 계산 로직이 오픈소스로 공개되어 있음</Typography></li>
          </ul>
          <Typography variant="body2" paragraph sx={{ mt: 2, fontWeight: 'bold', color: 'success.main' }}>
            ✅ 모든 지표는 실제 구현 코드와 DB 쿼리를 기반으로 계산되므로 신뢰할 수 있습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExplanationOpen(false)} variant="contained">
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      {/* 처리 로그 뷰어 */}
      {isMonitoring && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 실시간 처리 로그 (1000건마다)
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Kafka Consumer가 1000건씩 메시지를 처리할 때마다 자동으로 로그가 기록됩니다. (5초마다 갱신)
            </Typography>
          </Alert>
          <Box
            sx={{
              bgcolor: 'grey.900',
              color: 'grey.100',
              p: 2,
              borderRadius: 1,
              maxHeight: 400,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
            }}
          >
            {logs.length === 0 ? (
              <Typography variant="body2" color="grey.500">
                로그 대기 중... (1000건 처리 후 로그가 표시됩니다)
              </Typography>
            ) : (
              logs.map((log, index) => (
                <Box key={index} sx={{ mb: 0.5 }}>
                  <Typography
                    component="span"
                    sx={{
                      color: log.level === 'ERROR' ? 'error.light' : log.level === 'WARN' ? 'warning.light' : 'success.light',
                      fontWeight: 'bold',
                      mr: 1,
                    }}
                  >
                    [{log.level}]
                  </Typography>
                  <Typography component="span" sx={{ color: 'grey.400', mr: 1 }}>
                    {log.timestamp}
                  </Typography>
                  <Typography component="span" sx={{ color: 'grey.100' }}>
                    {log.message}
                  </Typography>
                </Box>
              ))
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default RealtimeMonitoring;
