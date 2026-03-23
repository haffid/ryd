import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'

import HomePage from '../pages/Home/HomePage'
import LoginPage from '../pages/Login/LoginPage'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import PageViewPage from '../pages/PageView/PageViewPage'
import UsersPage from '../pages/Users/UsersPage'
import PagesManagerPage from '../pages/Pages/PagesManagerPage'
import InsightsPage from '../pages/Insights/InsightsPage'
import RolesPage from '../pages/Roles/RolesPage'
import DocumentsPage from '../pages/Documents/DocumentsPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'

export default function AppRouter() {
  return (
    <Routes>
      {/* Public — auth layout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected — app layout */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Dynamic page view — driven by pages from Estructura */}
        <Route path="/p/:slug" element={<PageViewPage />} />
        <Route
          path="/users"
          element={
            <PrivateRoute requiredPermission="users:read">
              <UsersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/pages"
          element={
            <PrivateRoute requiredPermission="pages:write">
              <PagesManagerPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <PrivateRoute requiredPermission="insights:write">
              <InsightsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <PrivateRoute requiredPermission="users:write">
              <RolesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <PrivateRoute requiredPermission="pages:write">
              <DocumentsPage />
            </PrivateRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
