import { Router } from "express";
import {
  getCurrentUserController,
  updateUserProfileController,
  updateUserProfilePhotoController,
  checkUsernameController,
} from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get("/current", getCurrentUserController);
userRoutes.put("/profile", updateUserProfileController);
userRoutes.put("/profile/photo", updateUserProfilePhotoController);
userRoutes.get("/check-username/:name", checkUsernameController);

export default userRoutes;
