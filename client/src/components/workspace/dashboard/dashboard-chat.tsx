import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader,
  Bell,
  Wifi,
  WifiOff,
  Smile,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { toast } from "@/hooks/use-toast";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import {
  createCollaborationEntryMutationFn,
  getWorkspaceCollaborationQueryFn,
} from "@/lib/api";
import { useSocket } from "@/context/socket-provider";
import { useAuthContext } from "@/context/auth-provider";
import EmojiPickerComponent from "@/components/emoji-picker";

const DashboardChat = () => {
  const workspaceId = useWorkspaceId();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { socket, isConnected, joinWorkspace, leaveWorkspace } = useSocket();
  const [chatMessage, setChatMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevChatsLengthRef = useRef(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const queryKey = ["workspace-collaboration", workspaceId];

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => getWorkspaceCollaborationQueryFn(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: isConnected ? 60000 : 10000,
  });

  const { mutate, isPending: isPosting } = useMutation({
    mutationFn: createCollaborationEntryMutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const chats = data?.chats || [];
  const isChatConnected = isConnected || isBrowserOnline;

  useEffect(() => {
    const updateOnlineState = () => setIsBrowserOnline(navigator.onLine);
    updateOnlineState();
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    if (workspaceId && isConnected) {
      joinWorkspace(workspaceId);
    }
    return () => {
      if (workspaceId) {
        leaveWorkspace(workspaceId);
      }
    };
  }, [workspaceId, isConnected, joinWorkspace, leaveWorkspace]);

  useEffect(() => {
    if (!socket) return;
    const handleNewEntry = () => {
      queryClient.invalidateQueries({ queryKey });
      if (!isAtBottomRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
    };
    socket.on("collaboration:new", handleNewEntry);
    return () => {
      socket.off("collaboration:new", handleNewEntry);
    };
  }, [socket, queryClient, queryKey]);

  useEffect(() => {
    if (chats.length > prevChatsLengthRef.current) {
      const newMessagesCount = chats.length - prevChatsLengthRef.current;
      if (!isAtBottomRef.current) {
        setUnreadCount((prev) => prev + newMessagesCount);
      }
    }
    prevChatsLengthRef.current = chats.length;
  }, [chats.length]);

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chats]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    isAtBottomRef.current = isAtBottom;
    if (isAtBottom && unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [unreadCount]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isAtBottomRef.current = true;
      setUnreadCount(0);
    }
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    setChatMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const submitChat = (event: FormEvent) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;

    mutate(
      {
        workspaceId,
        data: {
          kind: "CHAT",
          message: chatMessage,
        },
      },
      {
        onSuccess: () => {
          setChatMessage("");
          setShowEmojiPicker(false);
          isAtBottomRef.current = true;
          setUnreadCount(0);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitChat(e as any);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header - WhatsApp style */}
      <div className="mb-2 flex items-center gap-1.5 border-b pb-1.5">
        <div className="relative">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span
            className={`absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full ${
              isChatConnected ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-semibold">Team Chat</h3>
          <p className="text-[10px] text-muted-foreground">
            {isChatConnected ? "Connected" : "Connecting..."}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground"
          >
            {unreadCount}
          </motion.span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {isChatConnected ? (
            <Wifi className="h-3 w-3 text-emerald-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-amber-500" />
          )}
        </span>
      </div>

      {/* Messages Area - WhatsApp style bubbles */}
      <div
        className="flex-1 overflow-y-auto pr-2"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 rounded-full bg-muted p-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              No messages yet
            </p>
            <p className="text-[11px] text-muted-foreground/70">
              Say hello to your team!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {chats.map((entry, idx) => {
                const isOwn = entry.author?._id === user?._id;
                const showAvatar =
                  idx === 0 ||
                  chats[idx - 1]?.author?._id !== entry.author?._id;
                const prevEntry = idx > 0 ? chats[idx - 1] : null;
                const showTimestamp =
                  !prevEntry ||
                  new Date(entry.createdAt).getTime() -
                    new Date(prevEntry.createdAt).getTime() >
                    300000; // 5 mins

                return (
                  <div key={entry._id}>
                    {/* Timestamp separator */}
                    {showTimestamp && (
                      <div className="flex justify-center py-2">
                        <span className="rounded-full bg-muted/70 px-3 py-1 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 22,
                      }}
                      className={`flex items-end gap-1.5 ${
                        isOwn ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* Avatar - only show for first message in a group or different author */}
                      {showAvatar && !isOwn ? (
                        <Avatar className="mb-1 h-7 w-7 flex-shrink-0">
                          <AvatarImage
                            src={entry.author?.profilePicture || ""}
                            alt={entry.author?.name}
                          />
                          <AvatarFallback
                            className={`text-[10px] ${getAvatarColor(
                              entry.author?.name || ""
                            )}`}
                          >
                            {getAvatarFallbackText(
                              entry.author?.name || "U"
                            )}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-7" />
                      )}

                      {/* Message Bubble - WhatsApp style */}
                      <div
                        className={`group max-w-[88%] rounded-2xl px-3 py-1.5 ${
                          isOwn
                            ? "rounded-br-md bg-primary/15 text-foreground"
                            : "rounded-bl-md bg-muted/70 text-foreground"
                        }`}
                      >
                        {/* Sender name for others' messages */}
                        {showAvatar && !isOwn && (
                          <p className="mb-0.5 text-[10px] font-semibold text-primary">
                            {entry.author?.name?.split(" ")[0] || "Unknown"}
                          </p>
                        )}
                        <p className="text-xs leading-relaxed break-words">
                          {entry.message}
                        </p>
                        {/* Timestamp - WhatsApp style at bottom */}
                        <div
                          className={`mt-0.5 flex items-center gap-1 ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground/60">
                            {format(new Date(entry.createdAt), "h:mm a")}
                          </span>
                          {isOwn && (
                            <span className="text-[10px] text-muted-foreground/40">
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2"
        >
          <Button
            variant="secondary"
            size="sm"
            className="w-full text-xs gap-1"
            onClick={scrollToBottom}
          >
            <Bell className="h-3 w-3" />
            {unreadCount} new message{unreadCount > 1 ? "s" : ""}
          </Button>
        </motion.div>
      )}

      {/* Message Input - WhatsApp style */}
      <form
        onSubmit={submitChat}
        className="mt-2 flex items-end gap-1.5 border-t pt-1.5"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={chatMessage}
            onChange={(event) => setChatMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full rounded-full border border-input bg-muted/50 px-3.5 py-2 pr-9 text-xs outline-none transition-colors focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>
        <Button
          disabled={isPosting || !chatMessage.trim()}
          type="submit"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
        >
          {isPosting ? (
            <Loader className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </form>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-20 right-0 z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <EmojiPickerComponent onSelectEmoji={handleEmojiSelect} />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardChat;

// Helper function for formatting time
function format(date: Date, formatStr: string) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  if (formatStr === "h:mm a") {
    return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  }
  return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}
