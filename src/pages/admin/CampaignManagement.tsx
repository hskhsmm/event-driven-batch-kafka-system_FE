import { useState, useEffect } from 'react';
import {
  Box,
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

const CampaignManagement = () => {
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
      setError('캠페인 목록을 불러오는데 실패했습니다.');
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
      loadCampaigns();
    } catch (err: any) {
      setFormError(err.response?.data?.error || '캠페인 생성에 실패했습니다.');
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">캠페인 관리</Typography>
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
    </Box>
  );
};

export default CampaignManagement;
