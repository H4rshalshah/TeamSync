import { FormEvent, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  Loader,
  MessageSquare,
  Send,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { toast } from "@/hooks/use-toast";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import {
  createCollaborationEntryMutationFn,
  deleteCollaborationEntriesMutationFn,
  deleteCollaborationEntryMutationFn,
  getWorkspaceCollaborationQueryFn,
} from "@/lib/api";
import { CollaborationEntryType } from "@/types/api.type";

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-lime-400"
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    />
  </div>
);

const formatChatTime = (date: Date) =>
  date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const EntryCard = ({
  entry,
  onDelete,
  selectable = false,
  selected = false,
  onToggle,
}: {
  entry: CollaborationEntryType;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    className={`group rounded-lg border bg-background/92 shadow-sm transition hover:border-primary/35 ${
      selectable
        ? "w-[min(100%,380px)] px-3 py-2.5"
        : "w-full max-w-[320px] px-3 py-2"
    }`}
  >
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2">
        {selectable && (
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggle?.(entry._id)}
            aria-label="Select message"
            className="mt-0.5 h-4 w-4 rounded-full"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{entry.author?.name}</p>
          {!selectable && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
      {!selectable && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-70 hover:opacity-100"
          onClick={() => onDelete(entry._id)}
          aria-label="Delete entry"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
    <p className="min-h-6 text-sm leading-relaxed text-foreground">
      {entry.message}
    </p>
    {selectable && (
      <p className="mt-2 text-right text-[11px] font-medium text-muted-foreground">
        {formatChatTime(new Date(entry.createdAt))}
      </p>
    )}
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {entry.progress !== null && entry.progress !== undefined && (
        <Badge variant="secondary">{entry.progress}% progress</Badge>
      )}
      {entry.blocker && <Badge variant="outline">Blocker: {entry.blocker}</Badge>}
      {entry.project && (
        <Badge variant="outline">
          {entry.project.emoji} {entry.project.name}
        </Badge>
      )}
    </div>
  </motion.div>
);

const WorkspaceCollaboration = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const [updateMessage, setUpdateMessage] = useState("");
  const [blocker, setBlocker] = useState("");
  const [progress, setProgress] = useState(50);
  const [chatMessage, setChatMessage] = useState("");
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  const queryKey = ["workspace-collaboration", workspaceId];

  const { data, isPending } = useQuery({
    queryKey,
    queryFn: () => getWorkspaceCollaborationQueryFn(workspaceId),
    enabled: Boolean(workspaceId),
    refetchInterval: 5000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const { mutate, isPending: isPosting } = useMutation({
    mutationFn: createCollaborationEntryMutationFn,
    onSuccess: invalidate,
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteEntry, isPending: isDeleting } = useMutation({
    mutationFn: deleteCollaborationEntryMutationFn,
    onSuccess: invalidate,
  });

  const { mutate: deleteSelectedChats, isPending: isDeletingSelected } =
    useMutation({
      mutationFn: async () => {
        await Promise.all(
          selectedChatIds.map((entryId) =>
            deleteCollaborationEntryMutationFn({ workspaceId, entryId })
          )
        );
      },
      onSuccess: () => {
        setSelectedChatIds([]);
        invalidate();
      },
    });

  const { mutate: clearWindow, isPending: isClearing } = useMutation({
    mutationFn: deleteCollaborationEntriesMutationFn,
    onSuccess: invalidate,
  });

  const summary = data?.summary;
  const memberProgress = data?.memberProgress || [];
  const updates = data?.updates || [];
  const chats = data?.chats || [];

  const stats = useMemo(
    () => [
      {
        label: "Project done",
        value: `${summary?.progress || 0}%`,
        icon: TrendingUp,
      },
      { label: "Completed", value: summary?.doneTasks || 0, icon: CheckCircle2 },
      { label: "Remaining", value: summary?.remainingTasks || 0, icon: Bell },
      { label: "Members", value: memberProgress.length, icon: Users },
    ],
    [summary, memberProgress.length]
  );

  const submitUpdate = (event: FormEvent) => {
    event.preventDefault();
    if (!updateMessage.trim()) return;

    mutate(
      {
        workspaceId,
        data: {
          kind: "UPDATE",
          message: updateMessage,
          progress,
          blocker: blocker || null,
        },
      },
      {
        onSuccess: () => {
          setUpdateMessage("");
          setBlocker("");
          toast({
            title: "Update posted",
            description: "Your team can see the latest project status.",
            variant: "success",
          });
        },
      }
    );
  };

  const submitChat = (event: FormEvent) => {
    event.preventDefault();
    if (!chatMessage.trim()) return;

    mutate(
      {
        workspaceId,
        data: { kind: "CHAT", message: chatMessage },
      },
      { onSuccess: () => setChatMessage("") }
    );
  };

  const handleDelete = (entryId: string) => {
    deleteEntry({ workspaceId, entryId });
  };

  const toggleSelectedChat = (entryId: string) => {
    setSelectedChatIds((current) =>
      current.includes(entryId)
        ? current.filter((id) => id !== entryId)
        : [...current, entryId]
    );
  };

  const handleClear = (kind: "UPDATE" | "CHAT", window: "1h" | "24h" | "7d") => {
    clearWindow({ workspaceId, kind, window });
  };

  return (
    <section className="grid gap-4">
      <div className="grid gap-2 md:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="rounded-lg border bg-background/75 p-3 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <motion.p
              className="mt-2 text-2xl font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {stat.value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {isPending ? (
        <Loader className="h-8 w-8 animate-spin place-self-center" />
      ) : (
        <>
          <motion.button
            type="button"
            onClick={() => setUpdatesOpen(true)}
            className="rounded-lg border bg-gradient-to-r from-primary/10 via-background to-background p-3 text-left shadow-sm"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Latest updates</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {updates[0]?.message || "No updates yet. Post the first team update."}
                </p>
              </div>
              <Badge variant="secondary">{updates.length} updates</Badge>
            </div>
          </motion.button>

          <div className="rounded-lg border p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <h3 className="text-sm font-semibold">Overall completion</h3>
              </div>
              <Badge variant="secondary">{summary?.progress || 0}% done</Badge>
            </div>
            <ProgressBar value={summary?.progress || 0} />
          </div>

          <div className="grid min-h-[480px] gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex min-h-[480px] flex-col rounded-lg border bg-background/70 p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <h3 className="text-sm font-semibold">Workspace chat</h3>
                </div>
                <div className="flex gap-0.5">
                  {selectedChatIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isDeletingSelected}
                      className="h-7 px-2 text-[10px]"
                      onClick={() => deleteSelectedChats()}
                    >
                      Delete {selectedChatIds.length}
                    </Button>
                  )}
                  {(["1h", "24h", "7d"] as const).map((window) => (
                    <Button
                      key={window}
                      size="sm"
                      variant="outline"
                      disabled={isClearing}
                      className="h-7 text-[10px] px-2"
                      onClick={() => handleClear("CHAT", window)}
                    >
                      Clear {window}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid flex-1 content-start gap-2 overflow-auto rounded-lg bg-muted/20 p-2.5">
                <AnimatePresence initial={false}>
                  {chats.map((entry, index) => (
                    <div
                      key={entry._id}
                      className={`flex ${
                        index % 2 === 0 ? "justify-start" : "justify-end"
                      }`}
                    >
                      <EntryCard
                        entry={entry}
                        selectable
                        selected={selectedChatIds.includes(entry._id)}
                        onToggle={toggleSelectedChat}
                      />
                    </div>
                  ))}
                </AnimatePresence>
                {chats.length === 0 && (
                  <p className="text-sm text-muted-foreground">Start a team conversation.</p>
                )}
              </div>
              <form onSubmit={submitChat} className="mt-3 flex gap-2">
                <Input
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  placeholder="Message the workspace"
                />
                <Button disabled={isPosting || !chatMessage.trim()} type="submit">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="grid gap-5">
              <div className="rounded-lg border bg-background/70 p-3 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold">Update panel</h3>
                <div className="grid gap-2">
                  {memberProgress.map((member) => {
                    const name = member.user?.name || "Unknown";
                    return (
                      <div key={member.memberId} className="rounded-lg border p-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.user?.profilePicture || ""} />
                              <AvatarFallback className={getAvatarColor(name)}>
                                {getAvatarFallbackText(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.completedTasks}/{member.assignedTasks} tasks done
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{member.remainingTasks} left</Badge>
                        </div>
                        <ProgressBar value={member.progress} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <form
                onSubmit={submitUpdate}
                className="rounded-lg border border-primary/20 bg-primary/[0.035] p-3 shadow-sm ring-1 ring-primary/10"
              >
                <h3 className="mb-2 text-sm font-semibold text-primary">
                  Post your work update
                </h3>
                <div className="grid gap-2">
                  <Textarea
                    value={updateMessage}
                    onChange={(event) => setUpdateMessage(event.target.value)}
                    placeholder="What did you finish, what is next, and what should the team know?"
                    rows={3}
                  />
                  <div className="grid gap-2 sm:grid-cols-[120px_1fr]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={progress}
                      onChange={(event) => setProgress(Number(event.target.value))}
                      aria-label="Progress percent"
                    />
                    <Input
                      value={blocker}
                      onChange={(event) => setBlocker(event.target.value)}
                      placeholder="Blocker, risk, or dependency"
                    />
                  </div>
                  <Button disabled={isPosting} type="submit" className="w-fit">
                    <Send className="h-4 w-4" />
                    Share update
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      <Dialog open={updatesOpen} onOpenChange={setUpdatesOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Latest updates</DialogTitle>
          </DialogHeader>                  <div className="mb-2 flex flex-wrap gap-1.5">
            {(["1h", "24h", "7d"] as const).map((window) => (
              <Button
                key={window}
                size="sm"
                variant="outline"
                disabled={isClearing}
                className="h-7 text-[10px] px-2"
                onClick={() => handleClear("UPDATE", window)}
              >
                Clear {window}
              </Button>
            ))}
          </div>
          <div className="grid max-h-[62vh] gap-2 overflow-auto pr-1">
            <AnimatePresence initial={false}>
              {updates.map((entry) => (
                <EntryCard key={entry._id} entry={entry} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
            {updates.length === 0 && (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {(isDeleting || isClearing) && <span className="sr-only">Updating history</span>}
    </section>
  );
};

export default WorkspaceCollaboration;
