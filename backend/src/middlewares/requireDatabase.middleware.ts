import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import { HTTPSTATUS } from "../config/http.config";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { isLocalDemoMode } from "../utils/local-demo-mode";

export const requireDatabase: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (isLocalDemoMode() || mongoose.connection.readyState === 1) {
    next();
    return;
  }

  res.status(HTTPSTATUS.SERVICE_UNAVAILABLE).json({
    message:
      "Database is not connected. Start MongoDB locally or set MONGO_URI to your MongoDB Atlas connection string.",
    errorCode: ErrorCodeEnum.DATABASE_UNAVAILABLE,
  });
};
