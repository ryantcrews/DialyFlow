import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import VisitTypeSelection from './pages/VisitTypeSelection';
import UnitSelection from './pages/UnitSelection';
import ShiftSelection from './pages/ShiftSelection';
import PatientListPage from './pages/PatientListPage';
import PatientRecordPage from './pages/PatientRecordPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPatients from './pages/admin/AdminPatients';
import AdminUsers from './pages/admin/AdminUsers';
import AdminExport from './pages/admin/AdminExport';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <VisitTypeSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/unit-selection"
        element={
          <ProtectedRoute>
            <UnitSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shift-selection/:unitId"
        element={
          <ProtectedRoute>
            <ShiftSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients/:unitId/:shiftId"
        element={
          <ProtectedRoute>
            <PatientListPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient/:patientId"
        element={
          <ProtectedRoute>
            <PatientRecordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute requireAdmin>
            <AdminPatients />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/export"
        element={
          <ProtectedRoute requireAdmin>
            <AdminExport />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
