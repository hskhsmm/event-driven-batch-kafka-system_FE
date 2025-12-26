import { Link, Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Home, AdminPanelSettings } from '@mui/icons-material';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            선착순 이벤트 시스템
          </Typography>
          <Button color="inherit" component={Link} to="/" startIcon={<Home />}>
            캠페인 목록
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/admin/campaigns"
            startIcon={<AdminPanelSettings />}
          >
            관리자
          </Button>
        </Toolbar>
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
