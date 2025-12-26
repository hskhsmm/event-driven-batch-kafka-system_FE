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
import { Home, Campaign, BarChart, Schedule } from '@mui/icons-material';

const Layout = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // 관리자 페이지 탭 값
  const getAdminTabValue = () => {
    if (location.pathname === '/admin/campaigns') return 0;
    if (location.pathname === '/admin/stats') return 1;
    if (location.pathname === '/admin/batch') return 2;
    return 0;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            선착순 이벤트 시스템
          </Typography>
          <Button color="inherit" component={Link} to="/" startIcon={<Home />}>
            사용자
          </Button>
        </Toolbar>
        {isAdminPage && (
          <Tabs
            value={getAdminTabValue()}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ bgcolor: 'primary.dark' }}
          >
            <Tab
              label="캠페인 관리"
              icon={<Campaign />}
              iconPosition="start"
              component={Link}
              to="/admin/campaigns"
            />
            <Tab
              label="통계"
              icon={<BarChart />}
              iconPosition="start"
              component={Link}
              to="/admin/stats"
            />
            <Tab
              label="배치"
              icon={<Schedule />}
              iconPosition="start"
              component={Link}
              to="/admin/batch"
            />
          </Tabs>
        )}
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[200],
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2025 선착순 이벤트 시스템
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
