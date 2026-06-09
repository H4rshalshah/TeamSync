import mongoose from "mongoose";
import crypto from "crypto";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import MemberModel from "../models/member.model";
import { ProviderEnum } from "../enums/account-provider.enum";
import { ensureDefaultRoles } from "../utils/ensure-default-roles";
import { config } from "../config/app.config";
import { isSmtpConfigured, sendPasswordResetEmail } from "../utils/mailer";

const isTransactionUnsupportedError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Transaction numbers are only allowed") ||
    message.includes("replica set member or mongos")
  );
};

const saveWithOptionalSession = async <T extends mongoose.Document>(
  document: T,
  session?: mongoose.ClientSession
) => {
  if (session) {
    await document.save({ session });
    return;
  }

  await document.save();
};

const normalizeAuthUser = (user: any) => {
  const userObject =
    typeof user?.toObject === "function" ? user.toObject() : { ...user };
  delete userObject.password;

  const currentWorkspace = userObject.currentWorkspace;
  userObject.currentWorkspace =
    currentWorkspace && typeof currentWorkspace === "object"
      ? String(currentWorkspace._id || currentWorkspace)
      : currentWorkspace
        ? String(currentWorkspace)
        : "";

  return userObject;
};

const ensureProviderAccount = async ({
  userId,
  provider,
  providerId,
  session,
}: {
  userId: mongoose.Types.ObjectId;
  provider: string;
  providerId: string;
  session?: mongoose.ClientSession;
}) => {
  let accountQuery = AccountModel.findOne({ provider, providerId });
  if (session) {
    accountQuery = accountQuery.session(session);
  }

  const account = await accountQuery;
  if (account) {
    if (String(account.userId) !== String(userId)) {
      if (provider === ProviderEnum.EMAIL) {
        account.userId = userId;
        await saveWithOptionalSession(account, session);
        return;
      }
      throw new BadRequestException("This login method is already linked to another account");
    }
    return;
  }

  await saveWithOptionalSession(
    new AccountModel({
      userId,
      provider,
      providerId,
    }),
    session
  );
};

const ensureUserWorkspace = async (
  user: any,
  session?: mongoose.ClientSession
) => {
  if (user.currentWorkspace) return;

  let membershipQuery = MemberModel.findOne({ userId: user._id }).sort({
    createdAt: 1,
  });
  if (session) {
    membershipQuery = membershipQuery.session(session);
  }

  const existingMembership = await membershipQuery;
  if (existingMembership?.workspaceId) {
    user.currentWorkspace = existingMembership.workspaceId;
    await saveWithOptionalSession(user, session);
    return;
  }

  await ensureDefaultRoles();

  const workspace = new WorkspaceModel({
    name: "My Workspace",
    description: `Workspace created for ${user.name}`,
    owner: user._id,
  });
  await saveWithOptionalSession(workspace, session);

  let ownerRoleQuery = RoleModel.findOne({
    name: Roles.OWNER,
  });
  if (session) {
    ownerRoleQuery = ownerRoleQuery.session(session);
  }

  const ownerRole = await ownerRoleQuery;
  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  await saveWithOptionalSession(
    new MemberModel({
      userId: user._id,
      workspaceId: workspace._id,
      role: ownerRole._id,
      joinedAt: new Date(),
    }),
    session
  );

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await saveWithOptionalSession(user, session);
};

export const loginOrCreateAccountService = async (data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
}) => {
  const { providerId, provider, displayName, email, picture } = data;

  const createAccount = async (session?: mongoose.ClientSession) => {
    await ensureDefaultRoles();

    let userQuery = UserModel.findOne({ email });
    if (session) {
      userQuery = userQuery.session(session);
    }

    let user = await userQuery;

    if (!user) {
      // Create a new user if it doesn't exist
      user = new UserModel({
        email,
        name: displayName,
        profilePicture: picture || null,
      });
      await saveWithOptionalSession(user, session);

      const account = new AccountModel({
        userId: user._id,
        provider: provider,
        providerId: providerId,
      });
      await saveWithOptionalSession(account, session);

      // 3. Create a new workspace for the new user
      const workspace = new WorkspaceModel({
        name: `My Workspace`,
        description: `Workspace created for ${user.name}`,
        owner: user._id,
      });
      await saveWithOptionalSession(workspace, session);

      let ownerRoleQuery = RoleModel.findOne({
        name: Roles.OWNER,
      });
      if (session) {
        ownerRoleQuery = ownerRoleQuery.session(session);
      }

      const ownerRole = await ownerRoleQuery;

      if (!ownerRole) {
        throw new NotFoundException("Owner role not found");
      }

      const member = new MemberModel({
        userId: user._id,
        workspaceId: workspace._id,
        role: ownerRole._id,
        joinedAt: new Date(),
      });
      await saveWithOptionalSession(member, session);

      user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
      await saveWithOptionalSession(user, session);
    } else {
      await ensureProviderAccount({
        userId: user._id as mongoose.Types.ObjectId,
        provider,
        providerId,
        session,
      });
      await ensureUserWorkspace(user, session);
    }
    return { user: normalizeAuthUser(user) };
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    console.log("Started Session...");

    const result = await createAccount(session);
    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (isTransactionUnsupportedError(error)) {
      return createAccount();
    }

    throw error;
  }
};

export const registerUserService = async (body: {
  email: string;
  name: string;
  password: string;
}) => {
  const { email, name, password } = body;

  const createUser = async (session?: mongoose.ClientSession) => {
    await ensureDefaultRoles();

    let existingUserQuery = UserModel.findOne({ email });
    if (session) {
      existingUserQuery = existingUserQuery.session(session);
    }

    const existingUser = await existingUserQuery;
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    const user = new UserModel({
      email,
      name,
      password,
    });
    await saveWithOptionalSession(user, session);

    const account = new AccountModel({
      userId: user._id,
      provider: ProviderEnum.EMAIL,
      providerId: email,
    });
    await saveWithOptionalSession(account, session);

    // 3. Create a new workspace for the new user
    const workspace = new WorkspaceModel({
      name: `My Workspace`,
      description: `Workspace created for ${user.name}`,
      owner: user._id,
    });
    await saveWithOptionalSession(workspace, session);

    let ownerRoleQuery = RoleModel.findOne({
      name: Roles.OWNER,
    });
    if (session) {
      ownerRoleQuery = ownerRoleQuery.session(session);
    }

    const ownerRole = await ownerRoleQuery;

    if (!ownerRole) {
      throw new NotFoundException("Owner role not found");
    }

    const member = new MemberModel({
      userId: user._id,
      workspaceId: workspace._id,
      role: ownerRole._id,
      joinedAt: new Date(),
    });
    await saveWithOptionalSession(member, session);

    user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    await saveWithOptionalSession(user, session);

    return {
      userId: user._id,
      workspaceId: workspace._id,
      user: normalizeAuthUser(user),
    };
  };

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await createUser(session);

    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");

    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (isTransactionUnsupportedError(error)) {
      return createUser();
    }

    throw error;
  }
};

export const verifyUserService = async ({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  provider?: string;
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  let user =
    provider === ProviderEnum.EMAIL
      ? await UserModel.findOne({ email: normalizedEmail })
      : null;

  if (!user) {
    const account = await AccountModel.findOne({
      provider,
      providerId: normalizedEmail,
    });
    user = account ? await UserModel.findById(account.userId) : null;
  }

  if (!user) {
    throw new NotFoundException("Invalid email or password");
  }

  if (!user.password) {
    throw new UnauthorizedException(
      "Please reset your password before signing in with email and password"
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedException("Invalid email or password");
  }

  if (provider === ProviderEnum.EMAIL) {
    await ensureProviderAccount({
      userId: user._id as mongoose.Types.ObjectId,
      provider: ProviderEnum.EMAIL,
      providerId: normalizedEmail,
    });
  }
  await ensureUserWorkspace(user);

  return normalizeAuthUser(user);
};

const getFrontendOrigin = () => {
  const origin = config.FRONTEND_ORIGIN.split(",")[0]?.trim();
  return origin?.startsWith("http") ? origin : "http://127.0.0.1:3000";
};

const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const requestPasswordResetService = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return { emailSent: false };
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = hashResetToken(token);
  user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const resetUrl = `${getFrontendOrigin()}/reset-password/${token}`;
  const emailSent = await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  return {
    emailSent,
    resetUrl: !isSmtpConfigured() && config.NODE_ENV !== "production" ? resetUrl : undefined,
  };
};

export const resetPasswordService = async ({
  token,
  password,
}: {
  token: string;
  password: string;
}) => {
  const user = await UserModel.findOne({
    resetPasswordTokenHash: hashResetToken(token),
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new BadRequestException("Reset link is invalid or expired");
  }

  user.password = password;
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await ensureUserWorkspace(user);
  await user.save();
  await ensureProviderAccount({
    userId: user._id as mongoose.Types.ObjectId,
    provider: ProviderEnum.EMAIL,
    providerId: user.email,
  });

  return { user: normalizeAuthUser(user), email: user.email };
};
