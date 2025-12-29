import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import type { Campaign, CreateCampaignRequest } from '../../types/index';
import { getCampaigns, createCampaign } from '../../api';
import { format } from 'date-fns';
import { ApiError } from '../../api/error';
import { useToast } from '../../components/ToastProvider';

const CampaignManagement = () => {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    name: '',
    totalStock: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // 캠페인 목록 로드
  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await getCampaigns();
      setCampaigns(data);
      setError(null);
    } catch (err) {
      let message = '캠페인 목록을 불러오는데 실패했습니다.';
      if (err instanceof ApiError) {
        message = err.message; // 서버가 제공하는 기본 메시지 사용
      }
      setError(message);
      showToast(message, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // 새 캠페인 만들기 버튼
  const handleOpenDialog = () => {
    setFormData({ name: '', totalStock: 0 });
    setFormError(null);
    setOpenDialog(true);
  };

  // 모달 닫기
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // 폼 입력 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalStock' ? parseInt(value) || 0 : value,
    }));
  };

  // 캠페인 생성
  const handleCreateCampaign = async () => {
    // 유효성 검증
    if (!formData.name.trim()) {
      setFormError('캠페인 이름은 필수입니다.');
      return;
    }
    if (formData.totalStock < 1) {
      setFormError('재고는 최소 1개 이상이어야 합니다.');
      return;
    }

    try {
      setCreating(true);
      setFormError(null);
      await createCampaign(formData);
      setOpenDialog(false);
      showToast('캠페인이 생성되었습니다.', 'success');
      loadCampaigns();
    } catch (err) {
      let message = '캠페인 생성에 실패했습니다.';
      if (err instanceof ApiError) {
        // errorCode에 따라 사용자 친화적인 메시지로 분기 처리
        switch (err.errorCode) {
          case 'COMMON_002': // 검증 실패
            message = `입력값을 확인해주세요: ${err.message}`;
            break;
          default:
            message = err.message; // 그 외 API 에러는 서버 메시지 그대로 사용
            break;
        }
      }
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>캠페인 관리</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          새 캠페인 만들기
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>캠페인명</TableCell>
              <TableCell align="right">재고</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>생성일</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.id}</TableCell>
                <TableCell>{campaign.name}</TableCell>
                <TableCell align="right">
                  {campaign.currentStock.toLocaleString()} /{' '}
                  {campaign.totalStock.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={campaign.status === 'OPEN' ? '진행 중' : '마감'}
                    color={campaign.status === 'OPEN' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {campaign.createdAt
                    ? format(new Date(campaign.createdAt), 'yyyy-MM-dd HH:mm')
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 캠페인 생성 모달 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>새 캠페인 만들기</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="캠페인 이름"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="totalStock"
            label="총 재고 수량"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.totalStock}
            onChange={handleInputChange}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button
            onClick={handleCreateCampaign}
            variant="contained"
            disabled={creating}
          >
            {creating ? <CircularProgress size={24} /> : '생성'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CampaignManagement;
