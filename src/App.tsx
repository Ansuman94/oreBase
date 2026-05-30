import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout/AppLayout';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { SearchPage } from './pages/SearchPage/SearchPage';
import { MineralsPage } from './pages/MineralsPage/MineralsPage';
import { ProcessesPage } from './pages/ProcessesPage/ProcessesPage';
import { SuppliersPage } from './pages/SuppliersPage/SuppliersPage';
import { PlannerPage } from './pages/PlannerPage/PlannerPage';
import { PredictorPage } from './pages/PredictorPage/PredictorPage';
import { SearchResultsPage } from './pages/SearchResultsPage/SearchResultsPage';
import { UsersPage } from './pages/UsersPage/UsersPage';

// Simple unauthorized page — no extra file needed
function UnauthorizedPage() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:12, fontFamily:'sans-serif' }}>
      <h2 style={{ margin:0 }}>Access restricted</h2>
      <p style={{ color:'#888', margin:0 }}>Your account role does not have permission to view this page.</p>
      <a href="/search" style={{ color:'#C85A0A' }}>← Back to search</a>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/"             element={<Navigate to="/search" replace />} />

          {/* viewer+ */}
          <Route path="/search" element={
            <ProtectedRoute><AppLayout><SearchPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/search/results" element={
            <ProtectedRoute><AppLayout><SearchResultsPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/minerals" element={
            <ProtectedRoute><AppLayout><MineralsPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute><AppLayout><SuppliersPage /></AppLayout></ProtectedRoute>
          } />

          {/* analyst+ */}
          <Route path="/processes" element={
            <ProtectedRoute minRole="analyst"><AppLayout><ProcessesPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/planner" element={
            <ProtectedRoute minRole="analyst"><AppLayout><PlannerPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/predictor" element={
            <ProtectedRoute minRole="analyst"><AppLayout><PredictorPage /></AppLayout></ProtectedRoute>
          } />

          {/* admin only */}
          <Route path="/users" element={
            <ProtectedRoute minRole="admin"><AppLayout><UsersPage /></AppLayout></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
