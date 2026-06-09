import { useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  Loader,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { getWorkspaceCollaborationQueryFn } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { Button } from "@/components/ui/button";

const updateIcons: Record<string, React.ReactNode> = {
  UPDATE: <Zap className="h-3 w-3" />,
  CHAT: <MessageSquare className="h-3 w-3" />,
};

const updateColors: Record<string, string> = {
  UPDATE: "text-amber-500 bg-amber-500/10",
  CHAT: "text-purple-500 bg-purple-500/10",
};

const updateBgBorders: Record<string, string> = {
  UPDATE: "border-l-amber-500/30",
  CHAT: "border-l-purple-500/30",
};

const DashboardUpdates = () => {
  const workspaceId = useWorkspaceId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);

  const { data, isPending } = useQuery({
    queryKey: ["workspace-collaboration", workspaceId],
    queryFn: () => getWorkspaceCollaborationQueryFn(workspaceId),
    enabled: !!workspaceId,
    refetchInterval: 15000,
  });

  const updates = useMemo(() => {
    if (!data?.updates) return [];
    return data.updates.slice(0, 15);
  }, [data?.updates]);

  // Auto-scroll to show latest updates
  useEffect(() => {
    if (autoScroll && scrollRef.current && updates.length > 0) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [updates.length, autoScroll]);

  const showMore = () => setVisibleCount((prev) => Math.min(prev + 4, updates.length));
  const showLess = () => setVisibleCount(6);

  const displayedUpdates = updates.slice(0, visibleCount);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-1.5 border-b pb-1.5">
        <div className="relative">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h3 className="text-xs font-semibold">Latest Updates</h3>
        {isPending && (
          <Loader className="ml-auto h-2.5 w-2.5 animate-spin text-muted-foreground" />
        )}
        {!isPending && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            Live
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 scroll-smooth"
        onScroll={() => {
          if (scrollRef.current) {
            const { scrollTop } = scrollRef.current;
            setAutoScroll(scrollTop < 30);
          }
        }}
      >
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
            </div>
          </div>
        ) : updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mb-3 rounded-full bg-muted p-3"
            >
              <RefreshCw className="h-5 w-5 text-muted-foreground/50" />
            </motion.div>
            <p className="text-xs font-medium text-muted-foreground">
              No updates yet
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Activity and updates will appear here
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {displayedUpdates.map((update, index) => {
                  const isBlocker = !!update.blocker;
                  const isProgress =
                    update.progress !== null && update.progress !== undefined;
                  return (
                    <motion.div
                      key={update._id}
                      layout
                      initial={{ opacity: 0, x: -10, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      transition={{
                        delay: index * 0.025,
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className={`rounded-lg border bg-card/50 p-2 border-l-2 transition-all duration-200 hover:bg-muted/30 hover:shadow-sm ${updateBgBorders[update.kind] || "border-l-border"}`}
                    >
                      <div className="flex items-start gap-1.5">
                        <Avatar className="mt-0.5 h-5 w-5 flex-shrink-0 ring-1 ring-border/50">
                          <AvatarImage
                            src={update.author?.profilePicture || ""}
                            alt={update.author?.name}
                          />
                          <AvatarFallback
                            className={`text-[8px] ${getAvatarColor(
                              update.author?.name || ""
                            )}`}
                          >
                            {getAvatarFallbackText(
                              update.author?.name || "U"
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-semibold">
                              {update.author?.name?.split(" ")[0] || "Unknown"}
                            </span>
                            <span
                              className={`rounded-full p-0.5 ${
                                updateColors[update.kind] || ""
                              }`}
                            >
                              {updateIcons[update.kind] || null}
                            </span>
                            {update.project && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {update.project.emoji} {update.project.name}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-foreground/80 line-clamp-2">
                            {update.message}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {isProgress && (
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${update.progress}%` }}
                                    transition={{
                                      duration: 1.2,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
                                >
                                  {update.progress}%
                                </motion.span>
                              </div>
                            )}
                            {isBlocker && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-0.5 text-[10px] text-rose-500 font-medium"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Blocked
                              </motion.span>
                            )}
                            <span className="ml-auto text-[10px] text-muted-foreground/50">
                              {formatDistanceToNow(
                                new Date(update.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Show more/less controls */}
            {updates.length > 6 && (
              <div className="mt-3 flex justify-center gap-2">
                {visibleCount < updates.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={showMore}
                  >
                    <ChevronDown className="h-3 w-3" />
                    Show {updates.length - visibleCount} more
                  </Button>
                )}
                {visibleCount > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={showLess}
                  >
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardUpdates;
