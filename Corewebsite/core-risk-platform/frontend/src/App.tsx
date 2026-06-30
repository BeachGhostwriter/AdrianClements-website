import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import LoginPage           from '@/pages/auth/login';
import DashboardPage       from '@/pages/dashboard/index';
import RadarPage           from '@/pages/radar/index';
import ForgePage           from '@/pages/forge/index';
import OpportunitiesPage   from '@/pages/opportunities/index';
import TopRisksPage        from '@/pages/top-risks/index';
import RiskControlPage     from '@/pages/risk-control/index';
import RiskInteractionPage from '@/pages/risk-interaction/index';
import RiskAggregationPage from '@/pages/risk-aggregation/index';
import LongTermRisksPage   from '@/pages/long-term-risks/index';
import ConformalPage       from '@/pages/conformal/index';
import CalibrationPage     from '@/pages/calibration/index';
import ObjectivesPage      from '@/pages/objectives/index';
import AdminUsersPage      from '@/pages/admin/users/index';
import AdminBUsPage        from '@/pages/admin/business-units/index';
import AdminParamsPage     from '@/pages/admin/parameters/index';
import AdminFormulasPage   from '@/pages/admin/formulas/index';

const ProtectedRoute = ({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>;
  if (!user)     return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => (
  <ProtectedRoute adminOnly>{children}</ProtectedRoute>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard"        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/radar"            element={<ProtectedRoute><RadarPage /></ProtectedRoute>} />
      <Route path="/forge"            element={<ProtectedRoute><ForgePage /></ProtectedRoute>} />
      <Route path="/opportunities"    element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
      <Route path="/top-risks"        element={<ProtectedRoute><TopRisksPage /></ProtectedRoute>} />
      <Route path="/risk-control"     element={<ProtectedRoute><RiskControlPage /></ProtectedRoute>} />
      <Route path="/risk-interaction" element={<ProtectedRoute><RiskInteractionPage /></ProtectedRoute>} />
      <Route path="/risk-aggregation" element={<ProtectedRoute><RiskAggregationPage /></ProtectedRoute>} />
      <Route path="/long-term-risks"  element={<ProtectedRoute><LongTermRisksPage /></ProtectedRoute>} />
      <Route path="/conformal"        element={<ProtectedRoute><ConformalPage /></ProtectedRoute>} />
      <Route path="/calibration"      element={<ProtectedRoute><CalibrationPage /></ProtectedRoute>} />
      <Route path="/objectives"       element={<ProtectedRoute><ObjectivesPage /></ProtectedRoute>} />

      <Route path="/admin/users"          element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/business-units" element={<AdminRoute><AdminBUsPage /></AdminRoute>} />
      <Route path="/admin/parameters"     element={<AdminRoute><AdminParamsPage /></AdminRoute>} />
      <Route path="/admin/formulas"       element={<AdminRoute><AdminFormulasPage /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
