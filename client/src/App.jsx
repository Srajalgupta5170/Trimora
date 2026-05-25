import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import SalonDetailsPage from './pages/SalonDetailsPage';
import BarberProfilePage from './pages/BarberProfilePage';
import Navbar from './components/Navbar';
import { Toaster } from 'sonner';

function AppContent() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const handleAuthenticate = (data) => {
    login(data.token, data.user);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {isAuthenticated && <Navbar />}
      
      <Routes>
        {!isAuthenticated ? (
          <Route path="/*" element={<AuthPage onAuthenticate={handleAuthenticate} />} />
        ) : (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/salon/:salonId" element={<SalonDetailsPage />} />
            <Route path="/barber/:barberId" element={<BarberProfilePage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>

      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;