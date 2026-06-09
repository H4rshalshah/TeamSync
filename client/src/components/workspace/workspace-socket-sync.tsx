import useWorkspaceSocketSync from "@/hooks/use-workspace-socket-sync";

/**
 * Wrapper component that activates real-time workspace synchronization.
 * Renders nothing — just runs the hook inside the component tree.
 */
const WorkspaceSocketSync = () => {
  useWorkspaceSocketSync();
  return null;
};

export default WorkspaceSocketSync;
