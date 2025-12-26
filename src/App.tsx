import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CampaignList from './pages/user/CampaignList';
import CampaignManagement from './pages/admin/CampaignManagement';
import StatsDashboard from './pages/admin/StatsDashboard';
import CampaignDetailStats from './pages/admin/CampaignDetailStats';
import BatchManagement from './pages/admin/BatchManagement';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 사용자 페이지 */}
        <Route index element={<CampaignList />} />

        {/* 관리자 페이지 */}
        <Route path="admin">
          <Route index element={<Navigate to="/admin/campaigns" replace />} />
          <Route path="campaigns" element={<CampaignManagement />} />
          <Route path="stats" element={<StatsDashboard />} />
          <Route path="batch" element={<BatchManagement />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
