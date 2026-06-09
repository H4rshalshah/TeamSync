import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { getWorkspacePath } from "@/lib/auth-navigation";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthRoute, isPasswordRecoveryRoute } from "./common/routePaths";

const AuthRoute = () => {
  const location = useLocation();
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;

  const _isAuthRoute = isAuthRoute(location.pathname);
  const _isPasswordRecoveryRoute = isPasswordRecoveryRoute(location.pathname);
  const workspacePath = getWorkspacePath(user?.currentWorkspace);

  if (isLoading && !_isAuthRoute) return <DashboardSkeleton />;

  if (!user || _isPasswordRecoveryRoute || !workspacePath) return <Outlet />;

  return <Navigate to={workspacePath} replace />;
};

export default AuthRoute;
