import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import {
  Plus,
  LayoutDashboard,
  Users,
  Link2,
  ListTodo,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Permissions } from "@/constant";
import PermissionsGuard from "@/components/resuable/permission-guard";
import useCreateProjectDialog from "@/hooks/use-create-project-dialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import AnalyticsCharts from "@/components/workspace/dashboard/analytics-charts";
import DashboardChat from "@/components/workspace/dashboard/dashboard-chat";
import DashboardUpdates from "@/components/workspace/dashboard/dashboard-updates";
import DashboardInvite from "@/components/workspace/dashboard/dashboard-invite";
import CreateTaskForm from "@/components/workspace/task/create-task-form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import RecentProjects from "@/components/workspace/project/recent-projects";
import RecentTasks from "@/components/workspace/task/recent-tasks";
import RecentMembers from "@/components/workspace/member/recent-members";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

const WorkspaceDashboard = () => {
  const { onOpen: onOpenProject } = useCreateProjectDialog();
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const [activeTab, setActiveTab] = useState("projects");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  return (
    <motion.main
      className="workspace-dashboard-shell flex flex-1 flex-col py-3 md:py-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div
        variants={headerVariants}
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Workspace Overview
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track progress, manage tasks, and collaborate with your team
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <PermissionsGuard requiredPermission={Permissions.CREATE_PROJECT}>
            <Button onClick={onOpenProject} size="default" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </PermissionsGuard>
        </motion.div>
      </motion.div>

      {/* Main Dashboard Content - stacks on mobile, side-by-side on lg+ */}
      <div className="flex flex-col gap-5 xl:flex-row">
        {/* Left Column - Main Content (full width on mobile, flex-1 on desktop) */}
        <div className="min-w-0 flex-1 space-y-5">
          {/* Analytics & Charts */}
          <AnalyticsCharts />

          {/* Bottom Tabs: Projects / Tasks / Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 80, damping: 15 }}
          >
            <Tabs
              defaultValue="projects"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="h-auto w-full justify-start gap-1.5 overflow-x-auto border-0 bg-muted/60 p-1">
                <TabsTrigger
                  value="projects"
                  className="data-[state=active]:bg-background shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                >
                  Recent Projects
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-background shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                >
                  Recent Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-background shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
                >
                  Recent Members
                </TabsTrigger>
              </TabsList>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="projects" className="mt-4">
                  <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-sm font-semibold">Recent Projects</h3>
                    </div>
                    <RecentProjects />
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-3">
                  <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-1.5">
                      <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-sm font-semibold">Recent Tasks</h3>
                    </div>
                    <RecentTasks />
                  </div>
                </TabsContent>

                <TabsContent value="members" className="mt-3">
                  <div className="rounded-xl border bg-card p-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <h3 className="text-sm font-semibold">Recent Members</h3>
                    </div>
                    <RecentMembers />
                  </div>
                </TabsContent>
              </motion.div>
            </Tabs>
          </motion.div>
        </div>

        {/* Right Sidebar - Invite + Updates + Chat (full width on mobile, w-[340px] on desktop) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 80, damping: 15 }}
          className="w-full space-y-4 xl:w-[300px] xl:shrink-0 2xl:w-[320px]"
        >
          {/* Invite Section */}
          <DashboardInvite />

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 100, damping: 15 }}
            className="rounded-xl border bg-card p-3 shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold">Quick Actions</h3>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <PermissionsGuard requiredPermission={Permissions.CREATE_PROJECT}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto flex-col gap-0.5 py-2 text-[11px]"
                  onClick={onOpenProject}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Project
                </Button>
              </PermissionsGuard>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-0.5 py-2 text-[11px]"
                onClick={() => setIsTaskDialogOpen(true)}
              >
                <ListTodo className="h-3.5 w-3.5" />
                New Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-auto flex-col gap-0.5 py-2 text-[11px]"
                onClick={() => navigate(`/workspace/${workspaceId}/members`)}
              >
                <Users className="h-3.5 w-3.5" />
                Invite Members
              </Button>
            </div>
          </motion.div>

          {/* Latest Updates Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, type: "spring", stiffness: 100, damping: 15 }}
            className="flex h-[180px] flex-col rounded-xl border bg-card p-3 shadow-sm sm:h-[190px]"
          >
            <DashboardUpdates />
          </motion.div>

          {/* Chat Section - WhatsApp style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, type: "spring", stiffness: 100, damping: 15 }}
            className="relative flex h-[270px] flex-col rounded-xl border bg-card p-3 shadow-sm sm:h-[290px]"
          >
            <DashboardChat />
          </motion.div>
        </motion.div>
      </div>

      {/* Create Task Dialog */}
      <Dialog modal={true} open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg border-0 max-h-[90vh] overflow-y-auto">
          <CreateTaskForm
            onClose={() => setIsTaskDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </motion.main>
  );
};

export default WorkspaceDashboard;
