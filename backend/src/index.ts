import "dotenv/config";
import http from "http";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";
import { setupSocket } from "./socket";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import localDemoRoutes from "./routes/local-demo.route";
import collaborationRoutes from "./routes/collaboration.route";
import mongoose from "mongoose";
import { isLocalDemoMode } from "./utils/local-demo-mode";
import { requireDatabase } from "./middlewares/requireDatabase.middleware";

const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = config.FRONTEND_ORIGIN.split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const localOrigins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ];
      const allAllowedOrigins = [...allowedOrigins, ...localOrigins];

      if (
        !origin ||
        allAllowedOrigins.includes(origin) ||
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.get(
  "/",
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new BadRequestException(
      "This is a bad request",
      ErrorCodeEnum.AUTH_INVALID_TOKEN
    );
    return res.status(HTTPSTATUS.OK).json({
      message: "Hello Subscribe to the channel & share",
    });
  })
);

app.use(`${BASE_PATH}`, localDemoRoutes);
app.get(`${BASE_PATH}/health`, (req: Request, res: Response) => {
  const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];
  res.status(HTTPSTATUS.OK).json({
    message: "API health check",
    api: "ok",
    database: dbStates[mongoose.connection.readyState] || "unknown",
    localDemoMode: isLocalDemoMode(),
  });
});
app.use(`${BASE_PATH}`, requireDatabase);
app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/collaboration`, isAuthenticated, collaborationRoutes);

app.use(errorHandler);

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = setupSocket(server);

// Make io accessible to routes/services
app.set("io", io);

server.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});

export default app;
