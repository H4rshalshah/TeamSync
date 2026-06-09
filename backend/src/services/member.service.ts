import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import UserModel from "../models/user.model";
import WorkspaceModel from "../models/workspace.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await MemberModel.findOne({
    userId,
    workspaceId,
  }).populate("role");

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = member.role?.name;

  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string,
  invitePassword?: string
) => {
  // Find workspace by invite code
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  if (workspace.invitePassword && workspace.invitePassword !== invitePassword) {
    throw new BadRequestException("Invalid invite password");
  }

  // Check if user is already a member
  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();

  if (existingMember) {
    const populatedMember = await existingMember.populate("role");
    await UserModel.findByIdAndUpdate(userId, {
      currentWorkspace: workspace._id,
    });
    return {
      workspaceId: workspace._id,
      role: populatedMember.role?.name || "MEMBER",
    };
  }

  const role = await RoleModel.findOne({ name: Roles.MEMBER });

  if (!role) {
    throw new NotFoundException("Role not found");
  }

  // Add user to workspace as a member
  const newMember = new MemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newMember.save();

  await UserModel.findByIdAndUpdate(userId, {
    currentWorkspace: workspace._id,
  });

  return { workspaceId: workspace._id, role: role.name };
};

export const validateWorkspaceInviteService = async (
  inviteCode: string,
  invitePassword?: string
) => {
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  if (workspace.invitePassword && workspace.invitePassword !== invitePassword) {
    throw new BadRequestException("Invalid invite password");
  }

  return {
    workspaceId: workspace._id,
    workspaceName: workspace.name,
  };
};
