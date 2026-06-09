import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { config } from "../config/app.config";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validation/auth.validation";
import { HTTPSTATUS } from "../config/http.config";
import {
  loginOrCreateAccountService,
  requestPasswordResetService,
  registerUserService,
  resetPasswordService,
} from "../services/auth.service";
import passport from "passport";
import {
  checkEmailService,
  checkUsernameService,
} from "../services/user.service";
import { ProviderEnum } from "../enums/account-provider.enum";

const getFrontendOrigin = () => {
  const origin = config.FRONTEND_ORIGIN.split(",")[0]?.trim();
  return origin?.startsWith("http") ? origin : "http://127.0.0.1:3000";
};

const getAuthFailureUrl = (provider: "google" | "github") => {
  return `${getFrontendOrigin()}/oauth/callback?status=failure&provider=${provider}`;
};

const getWorkspaceRedirectUrl = (workspaceId: string) =>
  `${getFrontendOrigin()}/workspace/${workspaceId}`;

export const googleLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const currentWorkspace = req.user?.currentWorkspace;

    if (!currentWorkspace) {
      return res.redirect(getAuthFailureUrl("google"));
    }

    return res.redirect(getWorkspaceRedirectUrl(String(currentWorkspace)));
  }
);

export const githubLoginController = asyncHandler(
  async (_req: Request, res: Response) => {
    if (
      !config.GITHUB_CLIENT_ID ||
      !config.GITHUB_CLIENT_SECRET ||
      !config.GITHUB_CALLBACK_URL
    ) {
      return res.redirect(getAuthFailureUrl("github"));
    }

    const params = new URLSearchParams({
      client_id: config.GITHUB_CLIENT_ID,
      redirect_uri: config.GITHUB_CALLBACK_URL,
      scope: "read:user user:email",
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }
);

export const githubLoginCallback = asyncHandler(
  async (req: Request, res: Response) => {
    if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CLIENT_SECRET) {
      return res.redirect(getAuthFailureUrl("github"));
    }

    const code = z.string().min(1).parse(req.query.code);

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: config.GITHUB_CLIENT_ID,
          client_secret: config.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: config.GITHUB_CALLBACK_URL,
        }),
      }
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      return res.redirect(getAuthFailureUrl("github"));
    }

    const [profileResponse, emailsResponse] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      }),
    ]);

    const profile = (await profileResponse.json()) as {
      id: number;
      login: string;
      name?: string;
      avatar_url?: string;
      email?: string | null;
    };
    const emailsData = (await emailsResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }> | unknown;
    const emails = Array.isArray(emailsData) ? emailsData : [];

    const primaryEmail =
      profile.email ||
      emails.find((item) => item.primary && item.verified)?.email ||
      emails.find((item) => item.verified)?.email;

    if (!primaryEmail) {
      return res.redirect(getAuthFailureUrl("github"));
    }

    const { user } = await loginOrCreateAccountService({
      provider: ProviderEnum.GITHUB,
      displayName: profile.name || profile.login,
      providerId: String(profile.id),
      picture: profile.avatar_url,
      email: primaryEmail,
    });

    req.logIn(user, (err) => {
      if (err || !user.currentWorkspace) {
        return res.redirect(getAuthFailureUrl("github"));
      }

      return res.redirect(getWorkspaceRedirectUrl(String(user.currentWorkspace)));
    });
  }
);

export const registerUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = registerSchema.parse({
      ...req.body,
    });

    const { user } = await registerUserService(body);

    req.logIn(user, (err) => {
      if (err) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
          message: "Registration succeeded but failed to log in automatically. Please sign in.",
        });
      }

      return res.status(HTTPSTATUS.CREATED).json({
        message: "User created successfully",
        user,
      });
    });
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const body = loginSchema.parse(req.body);

    passport.authenticate(
      "local",
      (
        err: Error | null,
        user: Express.User | false,
        info: { message: string } | undefined
      ) => {
        if (err) {
          return next(err);
        }

        if (!user) {
          return res.status(HTTPSTATUS.UNAUTHORIZED).json({
            message: info?.message || "Invalid email or password",
          });
        }

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }

          return res.status(HTTPSTATUS.OK).json({
            message: "Logged in successfully",
            user,
          });
        });
      }
    )(req, res, next);
  }
);

export const logOutController = asyncHandler(
  async (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res
          .status(HTTPSTATUS.INTERNAL_SERVER_ERROR)
          .json({ error: "Failed to log out" });
      }

      req.session = null;
      return res
        .status(HTTPSTATUS.OK)
        .json({ message: "Logged out successfully" });
    });
  }
);

export const forgotPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordResetService(body.email);

    return res.status(HTTPSTATUS.OK).json({
      message:
        "If this email is registered, a password reset link has been sent.",
      resetUrl: result.resetUrl,
    });
  }
);

export const resetPasswordController = asyncHandler(
  async (req: Request, res: Response) => {
    const body = resetPasswordSchema.parse({
      ...req.body,
      token: req.params.token,
    });

    const result = await resetPasswordService(body);

    return res.status(HTTPSTATUS.OK).json({
      message: "Password reset successfully. Please sign in with your new password.",
      email: result.email,
    });
  }
);

export const checkUsernameAvailabilityController = asyncHandler(
  async (req: Request, res: Response) => {
    const name = z.string().trim().min(1).parse(req.params.name);
    const { available } = await checkUsernameService(name);

    return res.status(HTTPSTATUS.OK).json({
      message: available ? "Username is available" : "Username is taken",
      available,
    });
  }
);

export const checkEmailAvailabilityController = asyncHandler(
  async (req: Request, res: Response) => {
    const email = z.string().trim().email().parse(req.params.email);
    const { available } = await checkEmailService(email);

    return res.status(HTTPSTATUS.OK).json({
      message: available ? "Email is available" : "Email is already registered",
      available,
    });
  }
);
