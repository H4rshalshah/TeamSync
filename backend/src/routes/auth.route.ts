import { Router } from "express";
import passport from "passport";
import { config } from "../config/app.config";
import {
  googleLoginCallback,
  checkEmailAvailabilityController,
  checkUsernameAvailabilityController,
  forgotPasswordController,
  githubLoginCallback,
  githubLoginController,
  loginController,
  logOutController,
  registerUserController,
  resetPasswordController,
} from "../controllers/auth.controller";
import { validateWorkspaceInviteController } from "../controllers/member.controller";

const failedUrl = `${config.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

const authRoutes = Router();
const isGoogleAuthEnabled =
  Boolean(config.GOOGLE_CLIENT_ID) && Boolean(config.GOOGLE_CLIENT_SECRET);

authRoutes.post("/register", registerUserController);
authRoutes.post("/login", loginController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password/:token", resetPasswordController);
authRoutes.get("/check-username/:name", checkUsernameAvailabilityController);
authRoutes.get("/check-email/:email", checkEmailAvailabilityController);
authRoutes.post("/invite/:inviteCode/validate", validateWorkspaceInviteController);

authRoutes.post("/logout", logOutController);
authRoutes.get("/github", githubLoginController);
authRoutes.get("/github/callback", githubLoginCallback);

authRoutes.get(
  "/google",
  isGoogleAuthEnabled
    ? passport.authenticate("google", {
        scope: ["profile", "email"],
      })
    : (req, res) =>
        res.status(503).json({
          message: "Google OAuth is not configured for local development.",
        })
);

authRoutes.get(
  "/google/callback",
  isGoogleAuthEnabled
    ? passport.authenticate("google", {
        failureRedirect: failedUrl,
      })
    : (req, res) =>
        res.status(503).json({
          message: "Google OAuth is not configured for local development.",
        }),
  googleLoginCallback
);

export default authRoutes;
