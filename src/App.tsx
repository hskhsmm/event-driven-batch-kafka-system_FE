import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/user/LandingPage';
import CampaignListPage from './pages/user/CampaignListPage';
import CampaignManagement from './pages/admin/CampaignManagement';
import StatsDashboard from './pages/admin/StatsDashboard';
import CampaignDetailStats from './pages/admin/CampaignDetailStats';
import BatchManagement from './pages/admin/BatchManagement';
import PerformanceTest from './pages/admin/PerformanceTest';
import RealtimeMonitoring from './pages/admin/RealtimeMonitoring';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 사용자 페이지 */}
        <Route index element={<LandingPage />} />
        <Route path="campaigns" element={<CampaignListPage />} />

        {/* 관리자 페이지 */}
        <Route path="admin">
          <Route index element={<Navigate to="/admin/campaigns" replace />} />
          <Route path="campaigns" element={<CampaignManagement />} />
          <Route path="campaigns/:id" element={<CampaignDetailStats />} />
          <Route path="dashboard" element={<StatsDashboard />} />
          <Route path="batch" element={<BatchManagement />} />
          <Route path="performance" element={<PerformanceTest />} />
          <Route path="monitoring" element={<RealtimeMonitoring />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
