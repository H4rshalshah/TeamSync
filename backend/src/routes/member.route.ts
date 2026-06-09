import { Router } from "express";
import {
  joinWorkspaceController,
  validateWorkspaceInviteController,
} from "../controllers/member.controller";

const memberRoutes = Router();

memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);
memberRoutes.post(
  "/workspace/:inviteCode/validate",
  validateWorkspaceInviteController
);

export default memberRoutes;
