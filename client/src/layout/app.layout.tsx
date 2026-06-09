import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/auth-provider";
import { SocketProvider } from "@/context/socket-provider";
import Asidebar from "@/components/asidebar/asidebar";
import Header from "@/components/header";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import CreateProjectDialog from "@/components/workspace/project/create-project-dialog";
import WorkspaceSocketSync from "@/components/workspace/workspace-socket-sync";

const AppLayout = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <SidebarProvider>
          <Asidebar />
          <SidebarInset className="app-theme-page overflow-x-hidden">
            <div className="w-full min-h-svh animate-in fade-in duration-500">
              <>
                <WorkspaceSocketSync />
                <Header />
                <div className="px-3 py-3 sm:px-4 lg:px-10 xl:px-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <Outlet />
                </div>
              </>
              <CreateWorkspaceDialog />
              <CreateProjectDialog />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default AppLayout;
