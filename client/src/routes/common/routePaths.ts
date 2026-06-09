import { matchPath } from "react-router-dom";

export const isAuthRoute = (pathname: string): boolean => {
  return Object.values(AUTH_ROUTES).some((path) =>
    Boolean(matchPath({ path, end: true }, pathname))
  );
};

export const isResetPasswordRoute = (pathname: string): boolean => {
  return Boolean(
    matchPath({ path: AUTH_ROUTES.RESET_PASSWORD, end: true }, pathname)
  );
};

export const isPasswordRecoveryRoute = (pathname: string): boolean => {
  return (
    pathname === AUTH_ROUTES.FORGOT_PASSWORD || isResetPasswordRoute(pathname)
  );
};

export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
  GOOGLE_OAUTH_CALLBACK: "/google/oauth/callback",
};

export const PROTECTED_ROUTES = {
  WORKSPACE: "/workspace/:workspaceId",
  TASKS: "/workspace/:workspaceId/tasks",
  MEMBERS: "/workspace/:workspaceId/members",
  SETTINGS: "/workspace/:workspaceId/settings",
  PROJECT_DETAILS: "/workspace/:workspaceId/project/:projectId",
  PROJECT_DASHBOARD: "/workspace/:workspaceId/project/:projectId/dashboard",
};

export const BASE_ROUTE = {
  LANDING: "/",
  INVITE_URL: "/invite/workspace/:inviteCode/join",
};
