import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PredictiveMaintenance from './pages/PredictiveMaintenance';
import ProductionLoss from './pages/ProductionLoss';
import RootCause from './pages/RootCause';
import ShiftIntelligence from './pages/ShiftIntelligence';
import EnergyAnalyzer from './pages/EnergyAnalyzer';
import DepartmentPerformance from './pages/DepartmentPerformance';
import KnowledgeVault from './pages/KnowledgeVault';
import AIAssistant from './pages/AIAssistant';

function ProtectedRoute({ children }) {
  const user = localStorage.getItem('ispat_user');
  if (!user) return <Navigate to="/login" replace />;
  const parsedUser = JSON.parse(user);
  return <Layout user={parsedUser}>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/predictive-maintenance" element={<ProtectedRoute><PredictiveMaintenance /></ProtectedRoute>} />
        <Route path="/production-loss" element={<ProtectedRoute><ProductionLoss /></ProtectedRoute>} />
        <Route path="/root-cause" element={<ProtectedRoute><RootCause /></ProtectedRoute>} />
        <Route path="/shift-intelligence" element={<ProtectedRoute><ShiftIntelligence /></ProtectedRoute>} />
        <Route path="/energy-analyzer" element={<ProtectedRoute><EnergyAnalyzer /></ProtectedRoute>} />
        <Route path="/department-performance" element={<ProtectedRoute><DepartmentPerformance /></ProtectedRoute>} />
        <Route path="/knowledge-vault" element={<ProtectedRoute><KnowledgeVault /></ProtectedRoute>} />
        <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
