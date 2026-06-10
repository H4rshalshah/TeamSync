import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Loader,
  Bell,
  Wifi,
  WifiOff,
  Smile,
  CheckCheck,
  Clock,
  Trash2,
  Eraser,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { toast } from "@/hooks/use-toast";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import {
  createCollaborationEntryMutationFn,
  deleteCollaborationEntriesMutationFn,
  deleteCollaborationEntryMutationFn,
  getWorkspaceCollaborationQueryFn,
} from "@/lib/api";
import { useSocket } from "@/context/socket-provider";
import { useAuthContext } from "@/context/auth-provider";
import EmojiPickerComponent from "@/components/emoji-picker";
import type { CollaborationEntryType } from "@/types/api.type";

// ─── Helpers ───────────────────────────────────────────────

const formatTime = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDateSeparator = (date: Date) => {
  const now = new Date();
  if (isSameDay(date, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const chatQueryKey = (workspaceId: string) => [
  "workspace-collaboration",
  workspaceId,
];

// ─── Component ─────────────────────────────────────────────

const MemberChat = () => {
  const workspaceId = useWorkspaceId();
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { socket, isConnected, joinWorkspace, leaveWorkspace } = useSocket();
  const [chatMessage, setChatMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<{
    top: string;
    bottom: string;
    left: string;
    right: string;
  }>({
    top: "auto",
    bottom: "80px",
    left: "auto",
    right: "0px",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const queryKey = chatQueryKey(workspaceId);

  // Selection state for delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Fetch chats ────────────────────────────────────────
  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => getWorkspaceCollaborationQueryFn(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: isConnected ? false : 10000,
  });

  const chats: CollaborationEntryType[] = data?.chats || [];
  const isChatConnected = isConnected || isBrowserOnline;

  // ── Optimistic mutation (instant send) ────────────────
  const { mutate, isPending: isPosting } = useMutation({
    mutationFn: createCollaborationEntryMutationFn,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      const optimisticEntry: CollaborationEntryType = {
        _id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        kind: "CHAT",
        message: payload.data.message,
        progress: null,
        blocker: null,
        author: {
          _id: user?._id || "",
          name: user?.name || "",
          email: user?.email,
          profilePicture: user?.profilePicture || null,
        },
        project: null,
        task: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          chats: [...(old.chats || []), optimisticEntry],
        };
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({
        title: "Failed to send",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Delete selected entries ────────────────────────────
  const { mutate: deleteSelected, isPending: isDeletingSelected } = useMutation({
    mutationFn: async () => {
      await Promise.all(
        Array.from(selectedIds).map((entryId) =>
          deleteCollaborationEntryMutationFn({ workspaceId, entryId })
        )
      );
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: `${selectedIds.size} message${selectedIds.size > 1 ? "s" : ""} deleted`,
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete messages",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ── Clear all chat (delete entries in last 7 days) ────
  const { mutate: clearChat, isPending: isClearing } = useMutation({
    mutationFn: () =>
      deleteCollaborationEntriesMutationFn({
        workspaceId,
        kind: "CHAT",
        window: "7d",
      }),
    onSuccess: () => {
      setSelectedIds(new Set());
      setSelectionMode(false);
      queryClient.invalidateQueries({ queryKey });
      toast({
        title: "Chat cleared",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to clear chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ── Online state tracking ──────────────────────────────
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

  // ── Join/leave workspace room ──────────────────────────
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

  // ── Socket: new message from other users ───────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewEntry = (entry: any) => {
      if (entry.kind !== "CHAT") return;

      if (entry.author?._id === user?._id) {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.chats) return old;
          const chats = old.chats.map((c: any) =>
            c._id?.startsWith("temp-") && c.author?._id === user?._id
              ? { ...entry, _id: entry._id }
              : c
          );
          return { ...old, chats };
        });
        return;
      }

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        if (old.chats?.some((c: any) => c._id === entry._id)) return old;
        return {
          ...old,
          chats: [...(old.chats || []), entry],
        };
      });

      if (!isAtBottomRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("collaboration:new", handleNewEntry);
    return () => {
      socket.off("collaboration:new", handleNewEntry);
    };
  }, [socket, queryClient, queryKey, user?._id]);

  // ── Scroll to bottom ───────────────────────────────────
  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [chats.length]);

  // ── Close emoji picker on outside click ────────────────
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

  // ── Smart emoji picker position ────────────────────
  useEffect(() => {
    if (!showEmojiPicker || !emojiButtonRef.current) return;
    const buttonRect = emojiButtonRef.current.getBoundingClientRect();
    const pickerWidth = 350;
    const pickerHeight = 400;
    const gap = 8;

    const rightSpace = window.innerWidth - buttonRect.right;
    const leftSpace = buttonRect.left;
    const spaceAbove = buttonRect.top;
    const spaceBelow = window.innerHeight - buttonRect.bottom;

    const position: typeof emojiPickerPosition = {
      top: "auto",
      bottom: "auto",
      left: "auto",
      right: "auto",
    };

    // Horizontal: prefer right, flip to left if not enough space
    if (rightSpace >= pickerWidth) {
      position.left = `${buttonRect.right - pickerWidth + 16}px`;
    } else if (leftSpace >= pickerWidth) {
      position.left = `${buttonRect.left}px`;
    } else {
      position.right = "16px";
    }

    // Vertical: prefer above, flip to below if not enough space above
    if (spaceAbove >= pickerHeight) {
      position.bottom = `${window.innerHeight - buttonRect.top + gap}px`;
    } else if (spaceBelow >= pickerHeight) {
      position.top = `${buttonRect.bottom + gap}px`;
    } else {
      position.bottom = `${window.innerHeight - buttonRect.top + gap}px`;
    }

    setEmojiPickerPosition(position);
  }, [showEmojiPicker]);

  // ── Scroll / unread handlers ───────────────────────────
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

  // ── Submit ─────────────────────────────────────────────
  const submitChat = (event: FormEvent) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;

    const message = chatMessage;
    setChatMessage("");
    setShowEmojiPicker(false);
    isAtBottomRef.current = true;
    setUnreadCount(0);

    mutate({
      workspaceId,
      data: {
        kind: "CHAT",
        message,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitChat(e as any);
    }
  };

  // ── Selection handlers ─────────────────────────────────
  const toggleSelection = (entryId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const cancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  // ── Render helpers ─────────────────────────────────────
  const renderMessage = (entry: CollaborationEntryType, idx: number) => {
    const isOwn = entry.author?._id === user?._id;
    const isTemp = entry._id?.startsWith("temp-");

    const prevEntry = idx > 0 ? chats[idx - 1] : null;
    const nextEntry = idx < chats.length - 1 ? chats[idx + 1] : null;
    const isFirstInGroup =
      !prevEntry || prevEntry.author?._id !== entry.author?._id;
    const isLastInGroup =
      !nextEntry || nextEntry.author?._id !== entry.author?._id;

    const showDateSeparator = (() => {
      if (idx === 0) return true;
      const current = new Date(entry.createdAt);
      const prev = new Date(prevEntry!.createdAt);
      return !isSameDay(current, prev);
    })();

    const isSelected = selectedIds.has(entry._id);

    return (
      <div key={entry._id}>
        {/* Date separator */}
        {showDateSeparator && (
          <div className="flex justify-center py-3">
            <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-xs">
              {formatDateSeparator(new Date(entry.createdAt))}
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 250,
            damping: 24,
            mass: 0.5,
          }}
          className={`flex items-end gap-1.5 px-1 ${
            isOwn ? "flex-row-reverse" : ""
          } ${isFirstInGroup ? "mt-1" : "mt-0.5"}`}
        >
          {/* Checkbox column in selection mode */}
          {selectionMode && (
            <div className="flex w-5 flex-shrink-0 items-center justify-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelection(entry._id)}
                aria-label="Select message"
                className="h-4 w-4"
              />
            </div>
          )}

          {/* Avatar column */}
          <div className="w-7 flex-shrink-0 flex justify-center">
            {!isOwn && isLastInGroup ? (
              <Avatar className="h-7 w-7 ring-1 ring-border/30">
                <AvatarImage
                  src={entry.author?.profilePicture || ""}
                  alt={entry.author?.name}
                />
                <AvatarFallback
                  className={`text-[9px] font-semibold ${getAvatarColor(
                    entry.author?.name || ""
                  )}`}
                >
                  {getAvatarFallbackText(entry.author?.name || "U")}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-7" />
            )}
          </div>

          {/* Message content */}
          <div
            className={`max-w-[82%] min-w-[60px] ${
              isOwn ? "items-end" : "items-start"
            } flex flex-col`}
          >
            {/* Sender name for others */}
            {!isOwn && isFirstInGroup && (
              <span className="mb-0.5 ml-1 text-[10px] font-semibold text-primary/80">
                {entry.author?.name?.split(" ")[0] || "Unknown"}
              </span>
            )}

            {/* Bubble + tail */}
            <div className="relative flex">
              <div
                className={`relative px-3 py-1.5 text-xs leading-relaxed break-words shadow-xs ${
                  isOwn
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-[8px] rounded-tr-[2px]"
                    : "bg-[#ffffff] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-[8px] rounded-tl-[2px] border border-[#e0e0e0] dark:border-[#313d45]"
                } ${isTemp ? "opacity-70" : ""} ${
                  selectionMode && isSelected ? "ring-2 ring-primary" : ""
                }`}
              >
                <p className="whitespace-pre-wrap pr-1">{entry.message}</p>

                {/* Timestamp + status row */}
                <div
                  className={`mt-0.5 flex items-center gap-1 ${
                    isOwn ? "justify-end" : "justify-start"
                  }`}
                >
                  <span
                    className={`text-[10px] leading-none text-[#667781] dark:text-[#aebac1]`}
                  >
                    {formatTime(new Date(entry.createdAt))}
                  </span>
                  {isOwn && (
                    <span className="flex items-center">
                      {isTemp ? (
                        <Clock className="h-3 w-3 text-[#667781] dark:text-[#aebac1]" />
                      ) : (
                        <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="relative flex h-full flex-col">
      {/* Chat Header */}
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
          <h3 className="text-xs font-semibold">Workspace Chat</h3>
          <p className="text-[10px] text-muted-foreground">
            {isChatConnected ? "Online" : "Connecting..."}
          </p>
        </div>

        {/* Action buttons */}
        {selectionMode ? (
          <div className="flex items-center gap-1">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                disabled={isDeletingSelected}
                className="h-7 px-2 text-[10px]"
                onClick={() => deleteSelected()}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete {selectedIds.size}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px]"
              onClick={cancelSelection}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-destructive"
              onClick={() => setSelectionMode(true)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isClearing || chats.length === 0}
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (chats.length === 0) return;
                if (window.confirm("Clear all chat messages?")) {
                  clearChat();
                }
              }}
            >
              <Eraser className="h-3 w-3 mr-1" />
              Clear Chat
            </Button>
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
        )}
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto pr-1"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader className="h-5 w-5 animate-spin text-muted-foreground/60" />
              <span className="text-[11px] text-muted-foreground/50">
                Loading messages...
              </span>
            </div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/80">
              No messages yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="pb-1">
            <AnimatePresence initial={false}>
              {chats.map((entry, idx) => renderMessage(entry, idx))}
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

      {/* Message Input */}
      <form
        onSubmit={submitChat}
        className="mt-2 flex items-end gap-1.5 border-t pt-2"
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={chatMessage}
            onChange={(event) => setChatMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isPosting}
            className="w-full rounded-full border border-input bg-muted/50 px-3.5 py-2.5 pr-10 text-xs outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>
        <Button
          disabled={!chatMessage.trim()}
          type="submit"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Emoji Picker — smart viewport-aware positioning */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="fixed z-[9999]"
          style={{
            bottom: emojiPickerPosition.bottom,
            right: emojiPickerPosition.right,
            left: emojiPickerPosition.left,
            top: emojiPickerPosition.top,
          }}
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

export default MemberChat;
