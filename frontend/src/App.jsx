import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';

import { Layout } from './components/common/Layout.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { FeedPage } from './pages/FeedPage.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { SearchPage } from './pages/SearchPage.jsx';
import { CommunitiesPage } from './pages/CommunitiesPage.jsx';
import { CommunityDetailPage } from './pages/CommunityDetailPage.jsx';
import { MessagesPage } from './pages/MessagesPage.jsx';
import { NotificationsPage } from './pages/NotificationsPage.jsx';
import { SavedPage } from './pages/SavedPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { PostDetailPage } from './pages/PostDetailPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Landing & Auth Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />

              {/* Main App Routes with 3-Column Layout */}
              <Route element={<Layout />}>
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/:slug" element={<CommunityDetailPage />} />
                <Route path="/post/:id" element={<PostDetailPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route
                  path="/settings/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved"
                  element={
                    <ProtectedRoute>
                      <SavedPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Full height chat route without right panel */}
              <Route element={<Layout hideRightPanel={true} />}>
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
