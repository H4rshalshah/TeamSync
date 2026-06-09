import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Camera,
  Loader,
  Save,
  User,
  Mail,
  Lock,
  Check,
  X,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/context/auth-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateUserProfileMutationFn,
  updateUserProfilePhotoMutationFn,
  checkUsernameQueryFn,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import PasswordInput from "@/components/auth/password-input";

const profileFormSchema = z
  .object({
    name: z.string().trim().min(1, "Username is required").max(255),
    email: z.string().trim().email("Invalid email address"),
    currentPassword: z
      .string()
      .trim()
      .min(4, "Password must be at least 4 characters")
      .optional()
      .or(z.literal("")),
    newPassword: z
      .string()
      .trim()
      .min(4, "Password must be at least 4 characters")
      .optional()
      .or(z.literal("")),
    confirmNewPassword: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }
  )
  .refine(
    (data) => {
      if (
        (data.currentPassword && !data.newPassword) ||
        (!data.currentPassword && data.newPassword)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Both current and new password are required to change password",
      path: ["currentPassword"],
    }
  );

const UserProfileSettings = () => {
  const { user, refetchAuth } = useAuthContext();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameTimer, setUsernameTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: updateUserProfileMutationFn,
    onSuccess: () => {
      refetchAuth();
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "success",
      });
      form.reset({
        name: form.getValues("name"),
        email: form.getValues("email"),
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const { mutate: updatePhoto, isPending: isUploading } = useMutation({
    mutationFn: updateUserProfilePhotoMutationFn,
    onSuccess: () => {
      refetchAuth();
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast({
        title: "Success",
        description: "Profile photo updated",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update photo",
        variant: "destructive",
      });
    },
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

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("name", user.name);
      form.setValue("email", user.email);
    }
  }, [user, form]);

  const watchedName = form.watch("name");

  useEffect(() => {
    if (usernameTimer) {
      clearTimeout(usernameTimer);
    }
    if (watchedName && watchedName !== user?.name && watchedName.trim().length > 0) {
      setIsCheckingUsername(true);
      const timer = setTimeout(() => {
        checkUsername(watchedName);
      }, 500);
      setUsernameTimer(timer);
    } else {
      setUsernameAvailable(null);
    }
    return () => {
      if (usernameTimer) clearTimeout(usernameTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedName]);

  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    if (isUpdating) return;
    const payload: {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    } = {};

    if (values.name !== user?.name) payload.name = values.name;
    if (values.email !== user?.email) payload.email = values.email;
    if (values.currentPassword && values.newPassword) {
      payload.currentPassword = values.currentPassword;
      payload.newPassword = values.newPassword;
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes to save", variant: "default" });
      return;
    }

    updateProfile(payload);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updatePhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials = getAvatarFallbackText(user.name);
  const avatarColor = getAvatarColor(user.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and account security
        </p>
      </div>

      {/* Profile Photo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 120, damping: 14 }}
        className="mb-8 flex items-center gap-6 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="relative">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20 ring-offset-2">
            <AvatarImage src={user.profilePicture || ""} alt={user.name} />
            <AvatarFallback className={`text-2xl ${avatarColor}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-70"
          >
            {isUploading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click the camera icon to upload a new photo
          </p>
        </div>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="!h-[48px] pr-10"
                        placeholder="Your username"
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
                  {usernameAvailable === true && watchedName !== user?.name && (
                    <p className="text-xs text-emerald-500">
                      Username is available!
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="!h-[48px]"
                      placeholder="your@email.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator className="my-2" />

            {/* Change Password Section */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Change Password</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          className="!h-[48px]"
                          placeholder="Current password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          className="!h-[48px]"
                          placeholder="New password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          className="!h-[48px]"
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isUpdating}
                className="h-10 gap-2"
              >
                {isUpdating ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
};

export default UserProfileSettings;
