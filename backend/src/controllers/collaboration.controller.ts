import { Request, Response } from "express";
import { z } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { Permissions } from "../enums/role.enum";
import { getMemberRoleInWorkspace } from "../services/member.service";
import {
  createCollaborationEntryService,
  deleteCollaborationEntriesByWindowService,
  deleteCollaborationEntryService,
  getWorkspaceCollaborationService,
  removeWorkspaceMemberService,
} from "../services/collaboration.service";
import { roleGuard } from "../utils/roleGuard";
import { workspaceIdSchema } from "../validation/workspace.validation";
import { emitCollaborationEntry, emitWorkspaceEvent } from "../socket";

const collaborationEntrySchema = z.object({
  kind: z.enum(["UPDATE", "CHAT"]),
  message: z.string().trim().min(1).max(2000),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  progress: z.coerce.number().min(0).max(100).optional().nullable(),
  blocker: z.string().trim().max(1000).optional().nullable(),
});

export const getWorkspaceCollaborationController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await getWorkspaceCollaborationService(workspaceId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Workspace collaboration fetched successfully",
      ...result,
    });
  }
);

export const createCollaborationEntryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const body = collaborationEntrySchema.parse(req.body);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const { entry } = await createCollaborationEntryService(
      workspaceId,
      userId,
      body
    );

    // Emit real-time event via socket.io
    const io = req.app.get("io");
    if (io) {
      emitCollaborationEntry(io, workspaceId, entry);
    }

    return res.status(HTTPSTATUS.CREATED).json({
      message: "Collaboration entry created successfully",
      entry,
    });
  }
);

export const removeWorkspaceMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const memberUserId = z.string().min(1).parse(req.params.memberUserId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.REMOVE_MEMBER]);

    const { memberId } = await removeWorkspaceMemberService(
      workspaceId,
      memberUserId,
      userId
    );

    // Real-time sync: notify all workspace members
    const io = req.app.get("io");
    if (io) {
      emitWorkspaceEvent(io, workspaceId, "member:removed", {
        workspaceId,
        memberId,
        memberUserId,
      });
    }

    return res.status(HTTPSTATUS.OK).json({
      message: "Member removed successfully",
      memberId,
    });
  }
);

export const deleteCollaborationEntryController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const entryId = z.string().min(1).parse(req.params.entryId);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await deleteCollaborationEntryService(workspaceId, entryId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Entry deleted successfully",
      ...result,
    });
  }
);

export const deleteCollaborationEntriesByWindowController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const workspaceId = workspaceIdSchema.parse(req.params.workspaceId);
    const body = z
      .object({
        kind: z.enum(["UPDATE", "CHAT"]),
        window: z.enum(["1h", "24h", "7d"]),
      })
      .parse(req.body);

    const { role } = await getMemberRoleInWorkspace(userId, workspaceId);
    roleGuard(role, [Permissions.VIEW_ONLY]);

    const result = await deleteCollaborationEntriesByWindowService(
      workspaceId,
      body.kind,
      body.window
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Entries deleted successfully",
      ...result,
    });
  }
);
