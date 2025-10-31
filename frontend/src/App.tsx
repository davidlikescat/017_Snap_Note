import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Record from '@/pages/Record';
import Write from '@/pages/Write';
import Result from '@/pages/Result';
import MemoList from '@/pages/MemoList';
import Settings from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/record"
                element={
                  <ProtectedRoute>
                    <Record />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/write"
                element={
                  <ProtectedRoute>
                    <Write />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/result"
                element={
                  <ProtectedRoute>
                    <Result />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/memos"
                element={
                  <ProtectedRoute>
                    <MemoList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
