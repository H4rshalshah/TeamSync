import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { z } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import {
  joinWorkspaceByInviteService,
  validateWorkspaceInviteService,
} from "../services/member.service";
import { emitWorkspaceEvent } from "../socket";

export const joinWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const invitePassword = z.string().trim().min(1).parse(req.body.invitePassword);
    const userId = req.user?._id;

    const { workspaceId, role } = await joinWorkspaceByInviteService(
      userId,
      inviteCode,
      invitePassword
    );

    // Real-time sync: notify existing workspace members
    const io = req.app.get("io");
    if (io) {
      emitWorkspaceEvent(io, String(workspaceId), "member:joined", {
        workspaceId: String(workspaceId),
        userId,
        role,
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      workspaceId,
      role,
    });
  }
);

export const validateWorkspaceInviteController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const invitePassword = z.string().trim().min(1).parse(req.body.invitePassword);

    const { workspaceId, workspaceName } = await validateWorkspaceInviteService(
      inviteCode,
      invitePassword
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Invite password verified",
      workspaceId,
      workspaceName,
    });
  }
);
