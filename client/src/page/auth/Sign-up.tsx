import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Logo from "@/components/logo";
import OAuthButtons from "@/components/auth/oauth-buttons";
import PasswordInput from "@/components/auth/password-input";
import { useMutation } from "@tanstack/react-query";
import { checkUsernameQueryFn, registerMutationFn } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Loader, Check, X } from "lucide-react";
import { getAuthSuccessPath } from "@/lib/auth-navigation";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: registerMutationFn,
  });

  const { mutate: checkUsername } = useMutation({
    mutationFn: checkUsernameQueryFn,
    onSuccess: (data) => {
      setUsernameAvailable(data.available);
      setIsCheckingUsername(false);
    },
    onError: () => {
      setIsCheckingUsername(false);
      setUsernameAvailable(null);
    },
  });

  const formSchema = z.object({
    name: z.string().trim().min(2, {
      message: "Username must be at least 2 characters",
    }),
    email: z.string().trim().email("Invalid email address").min(1, {
      message: "Email is required",
    }),
    password: z.string().trim().min(4, {
      message: "Password must be at least 4 characters",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    const name = watchedName?.trim();
    if (!name || name.length < 2) {
      setUsernameAvailable(null);
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = window.setTimeout(() => {
      checkUsername(name);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [watchedName, checkUsername]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPending) return;
    if (usernameAvailable === false) {
      toast({
        title: "Username taken",
        description: "This username is already taken. Please choose another.",
        variant: "destructive",
      });
      return;
    }

    mutate(values, {
      onSuccess: (data) => {
        const user = data.user;
        const nextPath = getAuthSuccessPath(user.currentWorkspace, returnUrl);
        if (!nextPath) {
          toast({
            title: "Workspace missing",
            description:
              "Account created, but no workspace was found. Please create or join a workspace.",
            variant: "destructive",
          });
          return;
        }
        navigate(nextPath);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="app-theme-page flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          Team Sync.
        </Link>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Create an account</CardTitle>
              <CardDescription>
                Signup with your email or OAuth provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-6">
                    <OAuthButtons label="Sign up" />
                    <div className="grid gap-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                              Username
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="John Doe"
                                  className="!h-[48px] pr-10"
                                  autoComplete="username"
                                  {...field}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {isCheckingUsername ? (
                                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : usernameAvailable === true ? (
                                    <Check className="h-4 w-4 text-emerald-500" />
                                  ) : usernameAvailable === false ? (
                                    <X className="h-4 w-4 text-red-500" />
                                  ) : null}
                                </div>
                              </div>
                            </FormControl>
                            {usernameAvailable === false && (
                              <p className="text-xs text-red-500">
                                This username is already taken
                              </p>
                            )}
                            {usernameAvailable === true && (
                              <p className="text-xs text-emerald-500">
                                Username is available
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="m@example.com"
                                className="!h-[48px]"
                                autoComplete="email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="dark:text-[#f1f7feb5] text-sm">
                              Password
                            </FormLabel>
                            <FormControl>
                              <PasswordInput
                                className="!h-[48px]"
                                autoComplete="new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={
                          isPending ||
                          usernameAvailable === false
                        }
                        className="w-full"
                      >
                        {isPending && <Loader className="animate-spin" />}
                        Sign up
                      </Button>
                    </div>
                    <div className="text-center text-sm">
                      Already have an account?{" "}
                      <Link
                        to={
                          returnUrl
                            ? `/sign-in?returnUrl=${returnUrl}`
                            : "/sign-in"
                        }
                        className="underline underline-offset-4"
                      >
                        Sign in
                      </Link>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
