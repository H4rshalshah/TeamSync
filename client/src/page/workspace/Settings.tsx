import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";
import EditWorkspaceForm from "@/components/workspace/edit-workspace-form";
import DeleteWorkspaceCard from "@/components/workspace/settings/delete-workspace-card";
import UserProfileSettings from "@/components/user/UserProfileSettings";
import { Permissions } from "@/constant";
import { useAuthContext } from "@/context/auth-provider";
import { User, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { hasPermission } = useAuthContext();
  const canManageWorkspace = hasPermission(
    Permissions.MANAGE_WORKSPACE_SETTINGS
  );

  return (
    <div className="w-full h-auto py-2">
      <WorkspaceHeader />
      <Separator className="my-4" />
      <main>
        <div className="w-full max-w-3xl mx-auto py-3">
          <Tabs
            defaultValue="profile"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6 h-auto w-full justify-start gap-2 overflow-x-auto border-0 bg-muted/60 p-1.5">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-background shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-all gap-2"
              >
                <User className="h-4 w-4" />
                My Profile
              </TabsTrigger>
              {canManageWorkspace && (
                <TabsTrigger
                  value="workspace"
                  className="data-[state=active]:bg-background shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-all gap-2"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Workspace
                </TabsTrigger>
              )}
            </TabsList>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="profile" className="mt-0">
                <UserProfileSettings />
              </TabsContent>

              {canManageWorkspace && (
                <TabsContent value="workspace" className="mt-0">
                  <h2 className="text-[20px] leading-[30px] font-semibold mb-3">
                    Workspace settings
                  </h2>
                  <div className="flex flex-col pt-0.5 px-0">
                    <div className="pt-2">
                      <EditWorkspaceForm />
                    </div>
                    <div className="pt-2">
                      <DeleteWorkspaceCard />
                    </div>
                  </div>
                </TabsContent>
              )}
            </motion.div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
