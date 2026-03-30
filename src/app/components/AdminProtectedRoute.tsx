import { Navigate, useLocation, Outlet } from 'react-router';
import { useAdminAuthStore } from '@/stores/admin-auth.store';

interface AdminProtectedRouteProps {
  requiredPermissions?: string[];
  children?: React.ReactNode;
}

/**
 * Route guard for admin panel. Checks admin JWT + optional permissions.
 *
 * Usage in routes.tsx:
 *   { element: <AdminProtectedRoute />, children: [ ...admin routes ] }
 */
export function AdminProtectedRoute({
  requiredPermissions,
  children,
}: AdminProtectedRouteProps) {
  const { isAuthenticated, user } = useAdminAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (
    requiredPermissions?.length &&
    user?.permissions &&
    !requiredPermissions.some((p) => user.permissions.includes(p))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ?? <Outlet />;
}
