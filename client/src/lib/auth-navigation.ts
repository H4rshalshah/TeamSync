type CurrentWorkspaceValue =
  | string
  | {
      _id?: string | null;
    }
  | null
  | undefined;

export const getWorkspaceId = (currentWorkspace: CurrentWorkspaceValue) => {
  if (typeof currentWorkspace === "string") {
    return currentWorkspace;
  }

  return currentWorkspace?._id || "";
};

export const getWorkspacePath = (currentWorkspace: CurrentWorkspaceValue) => {
  const workspaceId = getWorkspaceId(currentWorkspace);
  return workspaceId ? `/workspace/${workspaceId}` : null;
};

export const getAuthSuccessPath = (
  currentWorkspace: CurrentWorkspaceValue,
  returnUrl?: string | null
) => {
  const decodedReturnUrl = returnUrl ? decodeURIComponent(returnUrl) : null;

  if (
    decodedReturnUrl &&
    decodedReturnUrl.startsWith("/") &&
    !decodedReturnUrl.startsWith("/sign-in") &&
    !decodedReturnUrl.startsWith("/sign-up") &&
    !decodedReturnUrl.startsWith("/forgot-password") &&
    !decodedReturnUrl.startsWith("/reset-password") &&
    decodedReturnUrl !== "/"
  ) {
    return decodedReturnUrl;
  }

  return getWorkspacePath(currentWorkspace);
};
