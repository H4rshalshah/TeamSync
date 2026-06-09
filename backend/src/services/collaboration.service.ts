import mongoose from "mongoose";
import MemberModel from "../models/member.model";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import WorkspaceCollaborationModel, {
  CollaborationKind,
} from "../models/workspace-collaboration.model";
import { TaskStatusEnum } from "../enums/task.enum";
import { BadRequestException, NotFoundException } from "../utils/appError";

const ensureProjectInWorkspace = async (workspaceId: string, projectId?: string) => {
  if (!projectId) return;

  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException("Project not found in this workspace");
  }
};

export const createCollaborationEntryService = async (
  workspaceId: string,
  userId: string,
  body: {
    kind: CollaborationKind;
    message: string;
    projectId?: string | null;
    taskId?: string | null;
    progress?: number | null;
    blocker?: string | null;
  }
) => {
  const message = body.message?.trim();
  if (!message) {
    throw new BadRequestException("Message is required");
  }

  await ensureProjectInWorkspace(workspaceId, body.projectId || undefined);

  const entry = await WorkspaceCollaborationModel.create({
    workspace: workspaceId,
    author: userId,
    kind: body.kind,
    message,
    project: body.projectId || null,
    task: body.taskId || null,
    progress: body.progress ?? null,
    blocker: body.blocker?.trim() || null,
  });

  await entry.populate("author", "_id name email profilePicture");
  await entry.populate("project", "_id name emoji");
  await entry.populate("task", "_id title taskCode status");

  return { entry };
};

export const getWorkspaceCollaborationService = async (workspaceId: string) => {
  const entries = await WorkspaceCollaborationModel.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .limit(60)
    .populate("author", "_id name email profilePicture")
    .populate("project", "_id name emoji")
    .populate("task", "_id title taskCode status")
    .lean();

  const [members, tasks] = await Promise.all([
    MemberModel.find({ workspaceId })
      .populate("userId", "_id name email profilePicture")
      .populate("role", "_id name")
      .lean(),
    TaskModel.find({ workspace: workspaceId })
      .populate("assignedTo", "_id name email profilePicture")
      .lean(),
  ]);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.status === TaskStatusEnum.DONE).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === TaskStatusEnum.IN_PROGRESS
  ).length;
  const blockedOrBacklogTasks = tasks.filter(
    (task) => task.status === TaskStatusEnum.BACKLOG
  ).length;

  const memberProgress = members.map((member: any) => {
    const memberId = member.userId?._id?.toString();
    const assignedTasks = tasks.filter(
      (task: any) => task.assignedTo?._id?.toString() === memberId
    );
    const completedTasks = assignedTasks.filter(
      (task) => task.status === TaskStatusEnum.DONE
    ).length;
    const remainingTasks = assignedTasks.length - completedTasks;
    const latestUpdate = entries.find(
      (entry: any) =>
        entry.kind === "UPDATE" && entry.author?._id?.toString() === memberId
    );

    return {
      memberId: member._id,
      user: member.userId,
      role: member.role,
      assignedTasks: assignedTasks.length,
      completedTasks,
      remainingTasks,
      progress:
        assignedTasks.length > 0
          ? Math.round((completedTasks / assignedTasks.length) * 100)
          : 0,
      latestUpdate: latestUpdate || null,
    };
  });

  const summary = {
    totalTasks,
    doneTasks,
    inProgressTasks,
    remainingTasks: totalTasks - doneTasks,
    blockedOrBacklogTasks,
    progress: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
  };

  return {
    summary,
    memberProgress,
    updates: entries.filter((entry) => entry.kind === "UPDATE"),
    chats: entries.filter((entry) => entry.kind === "CHAT").reverse(),
  };
};

export const removeWorkspaceMemberService = async (
  workspaceId: string,
  memberUserId: string,
  actorUserId: string
) => {
  if (memberUserId === actorUserId) {
    throw new BadRequestException("You cannot remove yourself from this workspace");
  }

  const member = await MemberModel.findOne({
    userId: memberUserId,
    workspaceId,
  }).populate("role");

  if (!member) {
    throw new NotFoundException("Member not found in this workspace");
  }

  if ((member.role as any)?.name === "OWNER") {
    throw new BadRequestException("Workspace owner cannot be removed");
  }

  await TaskModel.updateMany(
    {
      workspace: new mongoose.Types.ObjectId(workspaceId),
      assignedTo: new mongoose.Types.ObjectId(memberUserId),
    },
    { $set: { assignedTo: null } }
  );

  await member.deleteOne();

  return { memberId: memberUserId };
};

export const deleteCollaborationEntryService = async (
  workspaceId: string,
  entryId: string
) => {
  const entry = await WorkspaceCollaborationModel.findOneAndDelete({
    _id: entryId,
    workspace: workspaceId,
  });

  if (!entry) {
    throw new NotFoundException("Collaboration entry not found");
  }

  return { entryId };
};

export const deleteCollaborationEntriesByWindowService = async (
  workspaceId: string,
  kind: CollaborationKind,
  window: "1h" | "24h" | "7d"
) => {
  const now = Date.now();
  const durationMs =
    window === "1h"
      ? 60 * 60 * 1000
      : window === "24h"
        ? 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;

  const result = await WorkspaceCollaborationModel.deleteMany({
    workspace: workspaceId,
    kind,
    createdAt: { $gte: new Date(now - durationMs) },
  });

  return { deletedCount: result.deletedCount || 0 };
};
