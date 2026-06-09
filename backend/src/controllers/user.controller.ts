import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  getCurrentUserService,
  updateUserProfileService,
  updateUserProfilePhotoService,
  checkUsernameService,
} from "../services/user.service";
import { z } from "zod";

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    const { user } = await getCurrentUserService(userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "User fetch successfully",
      user,
    });
  }
);

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().email().optional(),
  currentPassword: z.string().trim().min(4).optional(),
  newPassword: z.string().trim().min(4).optional(),
});

export const updateUserProfileController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const body = updateProfileSchema.parse(req.body);

    const { user } = await updateUserProfileService(userId, body);

    return res.status(HTTPSTATUS.OK).json({
      message: "Profile updated successfully",
      user,
    });
  }
);

const updatePhotoSchema = z.object({
  profilePicture: z.string(),
});

export const updateUserProfilePhotoController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { profilePicture } = updatePhotoSchema.parse(req.body);

    const { user } = await updateUserProfilePhotoService(userId, profilePicture);

    return res.status(HTTPSTATUS.OK).json({
      message: "Profile photo updated successfully",
      user,
    });
  }
);

export const checkUsernameController = asyncHandler(
  async (req: Request, res: Response) => {
    const name = z.string().trim().min(1).parse(req.params.name);

    const { available } = await checkUsernameService(name);

    return res.status(HTTPSTATUS.OK).json({
      message: available ? "Username is available" : "Username is taken",
      available,
    });
  }
);
