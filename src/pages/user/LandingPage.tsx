import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  GridLegacy as Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import { ArrowForward, TrendingUp, Shield, Speed } from '@mui/icons-material';
import type { Campaign } from '../../types/index';
import { getCampaigns } from '../../api';

const LandingPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await getCampaigns();
        setCampaigns(data.slice(0, 3)); // 최대 3개만 표시
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCampaigns();
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              textAlign: 'center',
              animation: 'fadeInUp 1s ease-out',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(30px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
            <Typography
              variant="h1"
              sx={{
                mb: 3,
                fontWeight: 900,
                fontSize: { xs: '2.5rem', md: '4.5rem', lg: '5.5rem' },
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
              }}
            >
              내맘대로 캠페인
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                mb: 6,
                fontSize: { xs: '1.1rem', md: '1.5rem' },
                fontWeight: 400,
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              원하는 캠페인을 만들고, 실시간으로 참여하세요.
              <br />
              간편하고 빠른 선착순 이벤트 플랫폼
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                component={Link}
                to="/campaigns"
                endIcon={<ArrowForward />}
                sx={{
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                캠페인 참여하기
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                to="/admin/campaigns"
                sx={{
                  px: 5,
                  py: 2,
                  fontSize: '1.1rem',
                }}
              >
                캠페인 만들기
              </Button>
            </Box>
          </Box>
        </Container>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: '50%',
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '-150px',
            width: '500px',
            height: '500px',
            background: 'rgba(0, 0, 0, 0.015)',
            borderRadius: '50%',
            zIndex: 0,
          }}
        />
      </Box>

      {/* Features Section */}
      <Box
        sx={{
          py: 12,
          background: '#fafafa',
          borderTop: '1px solid #e0e0e0',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Speed sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  빠른 처리
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  Kafka 기반 실시간 처리로
                  <br />
                  순간적인 트래픽도 안정적으로
                </Typography>
              </Box>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <Shield sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  정확한 관리
                </Typography>
.
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  중복 참여 방지 및
                  <br />
                  재고 관리 시스템
                </Typography>
              </Box>
            </Grid>
            <Grid item size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                  },
                }}
              >
                <TrendingUp sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight={700}>
                  실시간 통계
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  캠페인 진행 상황을
                  <br />
                  실시간으로 확인
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Campaign Preview Section */}
      <Box sx={{ py: 12, background: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              진행중인 캠페인
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              지금 바로 참여 가능한 이벤트를 확인하세요
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {loading
              ? [1, 2, 3].map((n) => (
                  <Grid item size={{ xs: 12, md: 4 }} key={n}>
                    <Card>
                      <CardContent>
                        <Skeleton variant="text" height={40} />
                        <Skeleton variant="text" height={20} sx={{ mt: 2 }} />
                        <Skeleton variant="rectangular" height={8} sx={{ mt: 3 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : campaigns.map((campaign) => {
                  const stockPercentage = (campaign.currentStock / campaign.totalStock) * 100;
                  const isOpen = campaign.status === 'OPEN' && campaign.currentStock > 0;

                  return (
                    <Grid item size={{ xs: 12, md: 4 }} key={campaign.id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, p: 4 }}>
                          <Typography variant="h5" gutterBottom fontWeight={700}>
                            {campaign.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color={isOpen ? 'success.main' : 'text.secondary'}
                            sx={{ mb: 3, fontWeight: 600 }}
                          >
                            {isOpen ? '진행 중' : '마감'}
                          </Typography>
                          <Typography variant="h6" gutterBottom fontWeight={600}>
                            {campaign.currentStock.toLocaleString()} / {campaign.totalStock.toLocaleString()}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={stockPercentage}
                            sx={{
                              mt: 2,
                              height: 6,
                              backgroundColor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#000000',
                              },
                            }}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {stockPercentage.toFixed(1)}% 남음
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              to="/campaigns"
              endIcon={<ArrowForward />}
              sx={{ px: 6, py: 2, fontSize: '1.05rem' }}
            >
              캠페인 더보기
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 12,
          background: '#000000',
          color: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h2"
              gutterBottom
              sx={{
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3rem' },
                mb: 3,
              }}
            >
              지금 바로 시작하세요
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 5,
                opacity: 0.9,
                fontWeight: 400,
              }}
            >
              누구나 쉽게 캠페인을 만들고 참여할 수 있습니다
            </Typography>
            <Button
              variant="contained"
              size="large"
              component={Link}
              to="/admin/campaigns"
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                backgroundColor: '#ffffff',
                color: '#000000',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
              }}
            >
              캠페인 만들기
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
