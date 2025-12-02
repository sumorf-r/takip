import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
