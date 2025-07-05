import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import Register from './pages/Register';
import Landing from './pages/Landing';
import './App.css';

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={
        <RoleRoute allowedRoles={['admin', 'manager', 'guard']}>
          <Layout>
            <Dashboard />
          </Layout>
        </RoleRoute>
      } />
      <Route path="/attendance" element={
        <RoleRoute allowedRoles={['admin', 'manager', 'guard']}>
          <Layout>
            <Attendance />
          </Layout>
        </RoleRoute>
      } />
      <Route path="/reports" element={
        <RoleRoute allowedRoles={['admin', 'manager']}>
          <Layout>
            <Reports />
          </Layout>
        </RoleRoute>
      } />
      <Route path="/alerts" element={
        <RoleRoute allowedRoles={['admin', 'manager', 'guard']}>
          <Layout>
            <Alerts />
          </Layout>
        </RoleRoute>
      } />
      <Route path="/profile" element={
        <RoleRoute allowedRoles={['admin', 'manager', 'guard']}>
          <Layout>
            <Profile />
          </Layout>
        </RoleRoute>
      } />
      <Route path="/guards" element={
        <RoleRoute allowedRoles={['admin', 'manager']}>
          <Navigate to="/users" replace />
        </RoleRoute>
      } />
      <Route path="/users" element={
        <RoleRoute allowedRoles={['admin']}>
          <Layout>
            <UserManagement />
          </Layout>
        </RoleRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

