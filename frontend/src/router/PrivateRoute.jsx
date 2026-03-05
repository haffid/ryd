import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { CircularProgress, Box } from '@mui/material'

/**
 * Wraps a route requiring authentication.
 * Optionally checks that the user has a specific permission.
 */
export default function PrivateRoute({ children, requiredPermission }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermission) {
    const [module, action] = requiredPermission.split(':')
    if (!user.permissions.includes(`${module}:${action}`)) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return children
}
