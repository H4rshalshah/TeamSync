import { useState } from "react";
import { Loader, MessageCircle, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import useAuth from "@/hooks/api/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  invitedUserJoinWorkspaceMutationFn,
  loginMutationFn,
  logoutMutationFn,
  registerMutationFn,
  validateWorkspaceInviteMutationFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";

const InviteUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"welcome" | "login" | "register">("welcome");
  const [invitePassword, setInvitePassword] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const param = useParams();
  const inviteCode = param.inviteCode as string;

  const { data: authData, isPending: isAuthLoading } = useAuth();
  const user = authData?.user;

  // Login mutation
  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
    mutationFn: loginMutationFn,
  });

  // Register mutation
  const { mutate: registerMutate, isPending: isRegisterPending } = useMutation({
    mutationFn: registerMutationFn,
  });

  const { mutate: logoutMutate, isPending: isLogoutPending } = useMutation({
    mutationFn: logoutMutationFn,
  });

  // Join workspace mutation (used after login/register)
  const { mutate: joinMutate, isPending: isJoinPending } = useMutation({
    mutationFn: invitedUserJoinWorkspaceMutationFn,
  });

  const { mutateAsync: validateInvite, isPending: isValidatePending } =
    useMutation({
      mutationFn: validateWorkspaceInviteMutationFn,
    });

  const inviteUrl = `${window.location.origin}${BASE_ROUTE.INVITE_URL.replace(
    ":inviteCode",
    inviteCode
  )}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `I was invited to join a TeamSync workspace: ${inviteUrl}`
  )}`;

  const joinWorkspace = () => {
    joinMutate(
      { inviteCode, invitePassword },
      {
        onSuccess: (data) => {
          queryClient.resetQueries({ queryKey: ["userWorkspaces"] });
          queryClient.resetQueries({ queryKey: ["authUser"] });
          toast({
            title: "Welcome!",
            description: "You've successfully joined the workspace!",
            variant: "success",
          });
          navigate(`/workspace/${data.workspaceId}`);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  const verifyInvitePassword = async () => {
    await validateInvite({ inviteCode, invitePassword });
  };

  const handleLoginAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginPending || isValidatePending) return;

    try {
      await verifyInvitePassword();
      loginMutate(
      { email: loginEmail, password: loginPassword },
      {
        onSuccess: () => {
          // Join workspace after successful login
          joinWorkspace();
        },
        onError: (error) => {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
      );
    } catch (error: any) {
      toast({
        title: "Invalid invite password",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterPending || isValidatePending) return;

    try {
      await verifyInvitePassword();
      registerMutate(
      { name: regName, email: regEmail, password: regPassword, termsAccepted: true },
      {
        onSuccess: () => {
          // Join workspace after successful registration
          joinWorkspace();
        },
        onError: (error) => {
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          });
        },
      }
      );
    } catch (error: any) {
      toast({
        title: "Invalid invite password",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleJoinExisting = (e: React.FormEvent) => {
    e.preventDefault();
    joinWorkspace();
  };

  const handleUseAnotherAccount = () => {
    logoutMutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setStep("welcome");
        setInvitePassword("");
        toast({
          title: "Signed out",
          description: "Now the invited member can login or create their own account.",
          variant: "success",
        });
      },
      onError: (error) => {
        toast({
          title: "Logout failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // If user is already logged in, show join form directly
  if (!isAuthLoading && user) {
    return (
      <div className="app-theme-page flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link to="/" className="flex items-center gap-2 self-center font-medium">
            <Logo />
            Team Sync.
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">You're invited!</CardTitle>
                <CardDescription>
                  Enter the invite password shared by the workspace owner to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-5 rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Workspace invite link
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This link is tied to invite code{" "}
                    <span className="font-semibold text-foreground">{inviteCode}</span>.
                  </p>
                </div>

                <div className="mb-4 rounded-lg border bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                  If this is not the invited member's account, switch account first.
                  Every member should join with their own email and password.
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={getAvatarColor(user.name)}>
                      {getAvatarFallbackText(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <form onSubmit={handleJoinExisting}>
                  <div className="mb-3 grid gap-2">
                    <Label htmlFor="invite-password">Invite password</Label>
                    <Input
                      id="invite-password"
                      value={invitePassword}
                      onChange={(e) => setInvitePassword(e.target.value)}
                      placeholder="Enter password shared by owner"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isJoinPending || !invitePassword.trim()}
                    className="w-full text-base"
                  >
                    {isJoinPending && <Loader className="!w-6 !h-6 animate-spin" />}
                    Join the Workspace
                  </Button>
                </form>

                <div className="mt-4 grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseAnotherAccount}
                    disabled={isLogoutPending}
                  >
                    {isLogoutPending && <Loader className="!w-4 !h-4 animate-spin" />}
                    Use another account
                  </Button>
                  <Button asChild variant="outline">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      <MessageCircle />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-theme-page flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          Team Sync.
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">You're invited!</CardTitle>
              <CardDescription>
                Join this workspace on TeamSync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Workspace invite link
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  This link is tied to invite code{" "}
                  <span className="font-semibold text-foreground">{inviteCode}</span>.
                </p>
              </div>

              {isAuthLoading ? (
                <Loader className="!w-11 !h-11 animate-spin mx-auto flex" />
              ) : (
                <AnimatePresence mode="wait">
                  {/* Step: Welcome - Choose login or register */}
                  {step === "welcome" && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg border bg-muted/30 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Do you already have a TeamSync account?
                        </p>
                      </div>
                      <div className="grid gap-3">
                        <Button
                          onClick={() => setStep("login")}
                          className="w-full gap-2 h-12 text-base"
                        >
                          <LogIn className="h-5 w-5" />
                          Yes, I have an account
                        </Button>
                        <Button
                          onClick={() => setStep("register")}
                          variant="outline"
                          className="w-full gap-2 h-12 text-base border"
                        >
                          <UserPlus className="h-5 w-5" />
                          No, create a new account
                        </Button>
                      </div>
                      <Separator className="my-2" />
                      <div className="grid gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={whatsappUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step: Login */}
                  {step === "login" && (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <form onSubmit={handleLoginAndJoin} className="space-y-4">
                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <Label htmlFor="login-email">Email</Label>
                            <Input
                              id="login-email"
                              type="email"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="login-password">Password</Label>
                            <Input
                              id="login-password"
                              type="password"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="Your password"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="login-invite-password">
                              Invite Password
                            </Label>
                            <Input
                              id="login-invite-password"
                              value={invitePassword}
                              onChange={(e) => setInvitePassword(e.target.value)}
                              placeholder="Enter password shared by owner"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setStep("welcome")}
                            className="flex-1"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={isLoginPending || isValidatePending || !loginEmail || !loginPassword || !invitePassword}
                            className="flex-1 gap-2"
                          >
                            {(isLoginPending || isValidatePending) && <Loader className="h-4 w-4 animate-spin" />}
                            Login & Join
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Step: Register */}
                  {step === "register" && (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <form onSubmit={handleRegisterAndJoin} className="space-y-4">
                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <Label htmlFor="reg-name">Username</Label>
                            <Input
                              id="reg-name"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder="John Doe"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="reg-email">Email</Label>
                            <Input
                              id="reg-email"
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="reg-password">Password</Label>
                            <Input
                              id="reg-password"
                              type="password"
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Create a password"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="reg-invite-password">
                              Invite Password
                            </Label>
                            <Input
                              id="reg-invite-password"
                              value={invitePassword}
                              onChange={(e) => setInvitePassword(e.target.value)}
                              placeholder="Enter password shared by owner"
                              className="!h-[48px]"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setStep("welcome")}
                            className="flex-1"
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            disabled={isRegisterPending || isValidatePending || !regName || !regEmail || !regPassword || !invitePassword}
                            className="flex-1 gap-2"
                          >
                            {(isRegisterPending || isValidatePending) && <Loader className="h-4 w-4 animate-spin" />}
                            Create & Join
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
          <p className="mt-4 text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4">
            By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default InviteUser;
