import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import LegalLayout from '../layouts/LegalLayout';
import ProtectedRoute from './ProtectedRoute';

import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import PrivacyPage from '../pages/PrivacyPage';
import TermsPage from '../pages/TermsPage';

import DashboardPage from '../pages/DashboardPage';
import ActivityLoggingPage from '../pages/ActivityLoggingPage';
import MyActivitiesPage from '../pages/MyActivitiesPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import GoalsPage from '../pages/GoalsPage';
import InsightsPage from '../pages/InsightsPage';
import LeaderboardPage from '../pages/LeaderboardPage';

function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function NotFoundPage() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'left' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>404 - Page not found</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        The page you are looking for does not exist.
      </p>
      <a href="/" style={{ color: 'var(--color-accent)' }}>
        Go to home
      </a>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          <AuthGuard>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/register"
        element={
          <AuthGuard>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </AuthGuard>
        }
      />

      {/* Legal pages */}
      <Route
        path="/privacy"
        element={
          <LegalLayout>
            <PrivacyPage />
          </LegalLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <LegalLayout>
            <TermsPage />
          </LegalLayout>
        }
      />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/log-activity" element={<ActivityLoggingPage />} />
          <Route path="/my-activities" element={<MyActivitiesPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
