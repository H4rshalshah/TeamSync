import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/context/socket-provider";
import useWorkspaceId from "@/hooks/use-workspace-id";

/**
 * Listens to real-time socket events for the current workspace and
 * invalidates the appropriate React Query cache entries so all
 * connected members see changes instantly without manual refresh.
 *
 * Events handled:
 *   task:created        → invalidate tasks + projects + analytics
 *   task:updated        → invalidate tasks + analytics
 *   task:deleted        → invalidate tasks + projects + analytics
 *   project:created     → invalidate projects
 *   project:updated     → invalidate projects + workspace
 *   project:deleted     → invalidate projects
 *   member:joined       → invalidate members + workspace
 *   member:removed      → invalidate members + workspace
 *   member:roleChanged  → invalidate members + workspace
 *   workspace:updated   → invalidate workspace
 */
const useWorkspaceSocketSync = () => {
  const workspaceId = useWorkspaceId();
  const { socket, isConnected, joinWorkspace, leaveWorkspace } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !workspaceId) return;

    // Join the workspace room to receive events
    joinWorkspace(workspaceId);

    // ── Tasks ──────────────────────────────────────────────
    socket.on("task:created", () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
    });

    socket.on("task:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
    });

    socket.on("task:deleted", () => {
      queryClient.invalidateQueries({ queryKey: ["all-tasks", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
    });

    // ── Projects ───────────────────────────────────────────
    socket.on("project:created", () => {
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
    });

    socket.on("project:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["singleProject"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    });

    socket.on("project:deleted", () => {
      queryClient.invalidateQueries({ queryKey: ["allprojects", workspaceId] });
    });

    // ── Members ────────────────────────────────────────────
    socket.on("member:joined", () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    });

    socket.on("member:removed", () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    });

    socket.on("member:roleChanged", () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    });

    // ── Workspace ──────────────────────────────────────────
    socket.on("workspace:updated", () => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
    });

    return () => {
      // Leave the workspace room
      leaveWorkspace(workspaceId);
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
      socket.off("project:created");
      socket.off("project:updated");
      socket.off("project:deleted");
      socket.off("member:joined");
      socket.off("member:removed");
      socket.off("member:roleChanged");
      socket.off("workspace:updated");
    };
  }, [socket, isConnected, workspaceId, joinWorkspace, leaveWorkspace, queryClient]);
};

export default useWorkspaceSocketSync;
