import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { Campaign, BarChart, Schedule, Science, Monitor, TrendingUp, Speed } from '@mui/icons-material';

const Layout = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // 관리자 페이지 탭 값
  const getAdminTabValue = () => {
    if (location.pathname.startsWith('/admin/campaigns')) return 0;
    if (location.pathname.startsWith('/admin/dashboard')) return 1;
    if (location.pathname.startsWith('/admin/batch')) return 2;
    if (location.pathname.startsWith('/admin/performance')) return 3;
    if (location.pathname.startsWith('/admin/monitoring')) return 4;
    if (location.pathname.startsWith('/admin/trends')) return 5;
    if (location.pathname.startsWith('/admin/load-test')) return 6;
    return 0; // 기본값
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: 'white',
        }}
      >
        <Toolbar sx={{ py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                fontWeight: 800,
                color: 'black',
                textDecoration: 'none',
                letterSpacing: '-0.01em',
                fontSize: '1.3rem',
              }}
            >
              내맘대로 캠페인
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              color="inherit"
              component={Link}
              to="/campaigns"
              sx={{
                color: 'black',
                fontWeight: 600,
                px: 2.5,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              캠페인
            </Button>
            <Button
              color="inherit"
              component={Link}
              to="/admin/campaigns"
              sx={{
                color: 'black',
                fontWeight: 600,
                px: 2.5,
                '&:hover': {
                  bgcolor: '#f5f5f5',
                },
              }}
            >
              관리자
            </Button>
          </Box>
        </Toolbar>
        {isAdminPage && (
          <Box sx={{ px: 3, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <Tabs
              value={getAdminTabValue()}
              textColor="primary"
              TabIndicatorProps={{
                style: {
                  backgroundColor: '#000000',
                  height: 2,
                }
              }}
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: '#666666',
                  '&.Mui-selected': {
                    color: '#000000',
                  },
                },
              }}
            >
              <Tab
                label="캠페인 관리"
                icon={<Campaign />}
                iconPosition="start"
                component={Link}
                to="/admin/campaigns"
              />
              <Tab
                label="통계 대시보드"
                icon={<BarChart />}
                iconPosition="start"
                component={Link}
                to="/admin/dashboard"
              />
              <Tab
                label="배치 관리"
                icon={<Schedule />}
                iconPosition="start"
                component={Link}
                to="/admin/batch"
              />
              <Tab
                label="성능 테스트"
                icon={<Science />}
                iconPosition="start"
                component={Link}
                to="/admin/performance"
              />
              <Tab
                label="실시간 모니터링"
                icon={<Monitor />}
                iconPosition="start"
                component={Link}
                to="/admin/monitoring"
              />
              <Tab
                label="캠페인 트렌드"
                icon={<TrendingUp />}
                iconPosition="start"
                component={Link}
                to="/admin/trends"
              />
              <Tab
                label="부하 테스트"
                icon={<Speed />}
                iconPosition="start"
                component={Link}
                to="/admin/load-test"
              />
            </Tabs>
          </Box>
        )}
      </AppBar>
      <Box sx={{ flex: 1, p: 4 }}>
        <Container maxWidth="lg">
           <Outlet />
        </Container>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          bgcolor: '#fafafa',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              © 2025 내맘대로 캠페인. All rights reserved.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Powered by Spring Boot + Kafka + React
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
