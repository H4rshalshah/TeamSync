import { Router } from "express";
import {
  createCollaborationEntryController,
  deleteCollaborationEntriesByWindowController,
  deleteCollaborationEntryController,
  getWorkspaceCollaborationController,
  removeWorkspaceMemberController,
} from "../controllers/collaboration.controller";

const collaborationRoutes = Router();

collaborationRoutes.get(
  "/workspace/:workspaceId",
  getWorkspaceCollaborationController
);
collaborationRoutes.post(
  "/workspace/:workspaceId/entry",
  createCollaborationEntryController
);
collaborationRoutes.delete(
  "/workspace/:workspaceId/entry/:entryId",
  deleteCollaborationEntryController
);
collaborationRoutes.delete(
  "/workspace/:workspaceId/entries",
  deleteCollaborationEntriesByWindowController
);
collaborationRoutes.delete(
  "/workspace/:workspaceId/member/:memberUserId",
  removeWorkspaceMemberController
);

export default collaborationRoutes;
