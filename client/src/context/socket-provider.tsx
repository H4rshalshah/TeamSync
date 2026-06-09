import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { baseURL } from "@/lib/base-url";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Extract the base origin (socket.io connects to the server origin)
    const serverUrl = baseURL || "http://localhost:5000";

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinWorkspace = useCallback((workspaceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join:workspace", workspaceId);
    }
  }, []);

  const leaveWorkspace = useCallback((workspaceId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave:workspace", workspaceId);
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinWorkspace,
        leaveWorkspace,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
