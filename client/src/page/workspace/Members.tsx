import { Separator } from "@/components/ui/separator";
import InviteMember from "@/components/workspace/member/invite-member";
import AllMembers from "@/components/workspace/member/all-members";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";
import WorkspaceCollaboration from "@/components/workspace/member/workspace-collaboration";

export default function Members() {
  return (
    <div className="w-full h-auto pt-2">
      <WorkspaceHeader />
      <Separator className="my-4 " />
      <main>
        <div className="w-full max-w-7xl mx-auto pt-3">
          <div>
            <h2 className="text-lg leading-[30px] font-semibold mb-1">
              Workspace members
            </h2>
            <p className="text-sm text-muted-foreground">
              Workspace members can view and join all Workspace project, tasks
              and create new task in the Workspace.
            </p>
          </div>
          <Separator className="my-4" />

          <WorkspaceCollaboration />
          <Separator className="my-4 !h-[0.5px]" />

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <InviteMember />
            <AllMembers />
          </div>
        </div>
      </main>
    </div>
  );
}
