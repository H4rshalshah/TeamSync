import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config/app.config";
import session from "cookie-session";
import passport from "passport";

// Session middleware matching the Express setup
const sessionMiddleware = session({
  name: "session",
  keys: [config.SESSION_SECRET],
  maxAge: 24 * 60 * 60 * 1000,
  secure: config.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "lax",
});

// Wrap session + passport for socket.io handshake
const wrap = (middleware: any) => (socket: Socket, next: any) =>
  middleware(socket.request, {} as any, next);

export const setupSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          config.FRONTEND_ORIGIN,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ];
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    },
  });

  // Apply session middleware to socket.io
  io.engine.use(sessionMiddleware as any);
  io.engine.use(passport.initialize() as any);
  io.engine.use(passport.session() as any);

  io.on("connection", (socket: Socket) => {
    const req = socket.request as any;
    const user = req.user;

    if (!user) {
      socket.disconnect();
      return;
    }

    const userId = user._id?.toString();
    console.log(`[Socket] User ${userId} connected`);

    // Join workspace room
    socket.on("join:workspace", (workspaceId: string) => {
      if (!workspaceId) return;
      const room = `workspace:${workspaceId}`;
      socket.join(room);
      console.log(`[Socket] User ${userId} joined room ${room}`);
    });

    // Leave workspace room
    socket.on("leave:workspace", (workspaceId: string) => {
      if (!workspaceId) return;
      const room = `workspace:${workspaceId}`;
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  return io;
};

// Helper to emit new collaboration entry to workspace room
export const emitCollaborationEntry = (
  io: Server,
  workspaceId: string,
  entry: any
) => {
  io.to(`workspace:${workspaceId}`).emit("collaboration:new", entry);
};
