import UserModel from "../models/user.model";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { hashValue } from "../utils/bcrypt";

export const getCurrentUserService = async (userId: string) => {
  const user = await UserModel.findById(userId)
    .populate("currentWorkspace")
    .select("-password");

  if (!user) {
    throw new BadRequestException("User not found");
  }

  return {
    user,
  };
};

export const updateUserProfileService = async (
  userId: string,
  body: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }
) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new NotFoundException("User not found");
  }

  // Update name
  if (body.name !== undefined) {
    // Check username uniqueness
    const existingUser = await UserModel.findOne({
      name: body.name,
      _id: { $ne: userId },
    });
    if (existingUser) {
      throw new BadRequestException("Username is already taken");
    }
    user.name = body.name;
  }

  // Update email
  if (body.email !== undefined) {
    const existingUser = await UserModel.findOne({
      email: body.email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      throw new BadRequestException("Email is already in use");
    }
    user.email = body.email;
  }

  // Update password
  if (body.currentPassword && body.newPassword) {
    const isMatch = await user.comparePassword(body.currentPassword);
    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }
    user.password = body.newPassword;
  }

  await user.save();

  const updatedUser = await UserModel.findById(userId)
    .populate("currentWorkspace")
    .select("-password");

  return { user: updatedUser };
};

export const updateUserProfilePhotoService = async (
  userId: string,
  profilePicture: string
) => {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    { profilePicture },
    { new: true }
  )
    .populate("currentWorkspace")
    .select("-password");

  if (!user) {
    throw new NotFoundException("User not found");
  }

  return { user };
};

export const checkUsernameService = async (name: string) => {
  const user = await UserModel.findOne({
    name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
  });
  return { available: !user };
};

export const checkEmailService = async (email: string) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  return { available: !user };
};
