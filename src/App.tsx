import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/user/LandingPage';
import CampaignListPage from './pages/user/CampaignListPage';
import CampaignManagement from './pages/admin/CampaignManagement';
import StatsDashboard from './pages/admin/StatsDashboard';
import CampaignDetailStats from './pages/admin/CampaignDetailStats';
import BatchManagement from './pages/admin/BatchManagement';

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
          <Route path="stats" element={<StatsDashboard />} />
          <Route path="stats/detail" element={<CampaignDetailStats />} />
          <Route path="batch" element={<BatchManagement />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
