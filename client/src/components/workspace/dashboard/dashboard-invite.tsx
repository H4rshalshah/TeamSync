import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Link2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";

const DashboardInvite = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const inviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
        ":inviteCode",
        workspace.inviteCode
      )}`
    : "";

  const invitePassword = workspace?.invitePassword || "";

  const copyToClipboard = (text: string, type: "link" | "password") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "link") {
        setCopiedLink(true);
        toast({
          title: "Link copied!",
          description: "Invite link copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedPassword(true);
        toast({
          title: "Password copied!",
          description: "Invite password copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopiedPassword(false), 2000);
      }
    });
  };

  if (workspaceLoading) return null;

  return (
    <PermissionsGuard requiredPermission={Permissions.ADD_MEMBER}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 100, damping: 15 }}
        className="rounded-xl border bg-card p-3 shadow-sm"
      >
        <div className="mb-2 flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-sm font-semibold">Quick Invite</h3>
        </div>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Share these details with team members to join this workspace
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input
                value={inviteUrl}
                readOnly
                className="h-8 pr-8 text-[11px] disabled:opacity-100 disabled:pointer-events-none"
                disabled
              />
              <Link2 className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => copyToClipboard(inviteUrl, "link")}
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input
                value={`Password: ${invitePassword}`}
                readOnly
                className="h-8 pr-8 text-[11px] disabled:opacity-100 disabled:pointer-events-none"
                disabled
              />
              <Key className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => copyToClipboard(invitePassword, "password")}
            >
              {copiedPassword ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </PermissionsGuard>
  );
};

export default DashboardInvite;
