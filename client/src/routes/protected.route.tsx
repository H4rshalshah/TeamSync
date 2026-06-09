import { DashboardSkeleton } from "@/components/skeleton-loaders/dashboard-skeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const location = useLocation();
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;

  if (isLoading) {
    return <DashboardSkeleton />;
  }
  const returnUrl = encodeURIComponent(
    `${location.pathname}${location.search}`
  );

  return user ? (
    <Outlet />
  ) : (
    <Navigate to={`/sign-in?returnUrl=${returnUrl}`} replace />
  );
};

export default ProtectedRoute;
