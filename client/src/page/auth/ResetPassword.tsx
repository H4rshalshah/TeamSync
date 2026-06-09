import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import Logo from "@/components/logo";
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
import { toast } from "@/hooks/use-toast";
import { resetPasswordMutationFn } from "@/lib/api";
import PasswordInput from "@/components/auth/password-input";

const formSchema = z
  .object({
    password: z.string().trim().min(4, "Password must be at least 4 characters"),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [hasResetError, setHasResetError] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: resetPasswordMutationFn,
    onSuccess: (data) => {
      setHasResetError(false);
      toast({
        title: "Password updated",
        description: data.message,
        variant: "success",
      });
      navigate(
        data.email
          ? `/sign-in?email=${encodeURIComponent(data.email)}`
          : "/sign-in"
      );
    },
    onError: (error: any) => {
      setHasResetError(true);
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="app-theme-page flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <Logo />
          Team Sync.
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set new password</CardTitle>
            <CardDescription>
              Create a new password for your Team Sync account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="grid gap-5"
                onSubmit={form.handleSubmit((values) => {
                  if (isPending || !token) return;
                  setHasResetError(false);
                  mutate({ token, password: values.password });
                })}
              >
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
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
                <Button disabled={isPending || !token} type="submit" className="w-full">
                  {isPending && <Loader className="animate-spin" />}
                  Update password
                </Button>
                {hasResetError && (
                  <Button asChild variant="outline" type="button" className="w-full">
                    <Link to="/forgot-password">Request a new reset link</Link>
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
