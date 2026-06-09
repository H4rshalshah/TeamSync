import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/auth-provider";
import { toast } from "@/hooks/use-toast";
import { CheckIcon, CopyIcon, Loader, MessageCircle } from "lucide-react";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";

const InviteMember = () => {
  const { workspace, workspaceLoading } = useAuthContext();
  const [copied, setCopied] = useState(false);

  const inviteUrl = workspace
    ? `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
        ":inviteCode",
        workspace.inviteCode
      )}`
    : "";
  const invitePassword = workspace?.invitePassword || "";

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopied(true);
        toast({
          title: "Copied",
          description: "Invite url copied to clipboard",
          variant: "success",
        });
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const whatsappUrl = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Join my TeamSync workspace: ${inviteUrl}\nInvite password: ${invitePassword}`
      )}`
    : "";

  return (
    <div className="flex flex-col pt-0.5 px-0 ">
      <h5 className="text-lg leading-[30px] font-semibold mb-1">
        Invite members
      </h5>
      <p className="text-sm text-muted-foreground leading-tight">
        Share the workspace link and password. New users create their own
        account first, then join this workspace as members.
      </p>

      <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>
        {workspaceLoading ? (
          <Loader
            className="w-8 h-8 
        animate-spin
        place-self-center
        flex"
          />
        ) : (
          <div className="grid gap-3 py-3">
            <div className="flex gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              disabled={true}
              className="disabled:opacity-100 disabled:pointer-events-none"
              value={inviteUrl}
              readOnly
            />
            <Button
              disabled={false}
              className="shrink-0"
              size="icon"
              onClick={handleCopy}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                aria-label="Invite password"
                disabled={true}
                className="disabled:opacity-100 disabled:pointer-events-none"
                value={`Invite password: ${invitePassword}`}
                readOnly
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(invitePassword);
                  toast({
                    title: "Copied",
                    description: "Invite password copied to clipboard",
                    variant: "success",
                  });
                }}
              >
                Copy password
              </Button>
            </div>
            <div className="grid gap-2">
              <Button asChild variant="outline">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle />
                  Send link and password on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </PermissionsGuard>
    </div>
  );
};

export default InviteMember;
