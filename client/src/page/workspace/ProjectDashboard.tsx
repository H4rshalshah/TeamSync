import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ListTodo,
  TrendingUp,
  BarChart3,
  GitPullRequest,
  Plus,
  Clock,
  Calendar,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import { getProjectByIdQueryFn, getProjectAnalyticsQueryFn, getAllTasksQueryFn } from "@/lib/api";
import TaskTable from "@/components/workspace/task/task-table";
import CreateTaskForm from "@/components/workspace/task/create-task-form";
import { format } from "date-fns";
import { TaskType } from "@/types/api.type";

const COLORS = {
  done: "#22c55e",
  overdue: "#ef4444",
  pending: "#6b7280",
  todo: "#eab308",
  inProgress: "#3b82f6",
  inReview: "#a855f7",
  low: "#6b7280",
  medium: "#3b82f6",
  high: "#f59e0b",
  urgent: "#ef4444",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

const AnimatedCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    variants={itemVariants}
    className={`rounded-xl border bg-card/80 backdrop-blur-sm p-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 ${className}`}
  >
    {children}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-xl text-sm">
        <p className="font-semibold text-foreground mb-1">{label || payload[0].name}</p>
        {payload.map((entry: any, idx: number) => (
          <p key={idx} className="text-muted-foreground" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const EmptyState = ({ icon: Icon, title, actionLabel, actionOnClick }: {
  icon: any;
  title: string;
  actionLabel?: string;
  actionOnClick?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-36 text-center px-4">
    <div className="rounded-full bg-muted/50 p-3 mb-2">
      <Icon className="h-6 w-6 text-muted-foreground/60" />
    </div>
    <p className="text-xs font-medium text-foreground/80">{title}</p>
    {actionLabel && actionOnClick && (
      <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs" onClick={actionOnClick}>
        <Plus className="h-3 w-3" />
        {actionLabel}
      </Button>
    )}
  </div>
);

const ProjectDashboard = () => {
  const param = useParams();
  const projectId = param.projectId as string;
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [chartKey, setChartKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: projectData, isPending: projectLoading } = useQuery({
    queryKey: ["singleProject", projectId],
    queryFn: () => getProjectByIdQueryFn({ workspaceId, projectId }),
    enabled: !!projectId,
  });

  const {
    data: analyticsData,
    isPending: analyticsLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: () => getProjectAnalyticsQueryFn({ workspaceId, projectId }),
    staleTime: 0,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    enabled: !!projectId,
  });

  const { data: tasksData, refetch: refetchTasks } = useQuery({
    queryKey: ["all-tasks", workspaceId, 1, 5, projectId],
    queryFn: () =>
      getAllTasksQueryFn({
        workspaceId,
        projectId,
        pageNumber: 1,
        pageSize: 5,
      }),
    enabled: !!projectId,
  });

  // Force ALL charts to re-animate on every successful fetch
  useEffect(() => {
    if (analyticsData) {
      setLastUpdated(new Date());
      const timer = setTimeout(() => setChartKey((k) => k + 1), 80);
      return () => clearTimeout(timer);
    }
  }, [analyticsData]);

  const handleRefresh = useCallback(() => {
    refetch();
    refetchTasks();
    setChartKey((k) => k + 1);
    setLastUpdated(new Date());
  }, [refetch, refetchTasks]);

  const isLoading = projectLoading || analyticsLoading;
  const project = projectData?.project;
  const analytics = analyticsData?.analytics;
  const recentTasks: TaskType[] = tasksData?.tasks || [];

  const completionRate = analytics?.totalTasks
    ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100)
    : 0;

  const pieData = [
    { name: "Completed", value: analytics?.completedTasks || 0, color: COLORS.done },
    { name: "Overdue", value: analytics?.overdueTasks || 0, color: COLORS.overdue },
    {
      name: "Pending",
      value: Math.max(0, (analytics?.totalTasks || 0) - (analytics?.completedTasks || 0) - (analytics?.overdueTasks || 0)),
      color: COLORS.pending,
    },
  ].filter((d) => d.value > 0);

  // Priority data (from enriched analytics)
  const priorityData = analytics?.priorityBreakdown
    ? [
        { name: "Urgent", value: analytics.priorityBreakdown.urgent || analytics.priorityBreakdown.URGENT || 0, color: COLORS.urgent },
        { name: "High", value: analytics.priorityBreakdown.high || analytics.priorityBreakdown.HIGH || 0, color: COLORS.high },
        { name: "Medium", value: analytics.priorityBreakdown.medium || analytics.priorityBreakdown.MEDIUM || 0, color: COLORS.medium },
        { name: "Low", value: analytics.priorityBreakdown.low || analytics.priorityBreakdown.LOW || 0, color: COLORS.low },
      ].filter((d) => d.value > 0)
    : [];

  // Status data
  const statusData = analytics?.statusBreakdown
    ? [
        { name: "Todo", value: analytics.statusBreakdown.todo || analytics.statusBreakdown.TODO || 0, color: COLORS.todo },
        { name: "In Progress", value: analytics.statusBreakdown.in_progress || analytics.statusBreakdown.IN_PROGRESS || 0, color: COLORS.inProgress },
        { name: "In Review", value: analytics.statusBreakdown.in_review || analytics.statusBreakdown.IN_REVIEW || 0, color: COLORS.inReview },
        { name: "Done", value: analytics.statusBreakdown.done || analytics.statusBreakdown.DONE || 0, color: COLORS.done },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <motion.div
      className="w-full space-y-6 py-4 md:pt-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <AnimatedCard>
        <div className="flex items-center justify-between">
          <Link
            to={`/workspace/${workspaceId}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-1">
              {lastUpdated && (
                <span className="hidden sm:inline">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button size="sm" className="gap-1.5" onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => navigate(`/workspace/${workspaceId}/projects/${projectId}`)}
              >
                <ExternalLink className="h-4 w-4" />
                Full Details
              </Button>
            </motion.div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-2xl">
            {project?.emoji || "📊"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">
                {project?.name || "Project Dashboard"}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {completionRate}% complete
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {project?.description || "Project overview and analytics"}
            </p>
          </div>
        </div>
      </AnimatedCard>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatedCard>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Total Tasks</p>
                <div className="rounded-lg bg-blue-500/10 p-1.5">
                  <ListTodo className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold">{analytics?.totalTasks || 0}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across this project</p>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <div className="rounded-lg bg-emerald-500/10 p-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-500">
                {analytics?.completedTasks || 0}
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    key={`completed-bar-${chartKey}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{completionRate}%</span>
              </div>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Overdue</p>
                <div className="rounded-lg bg-rose-500/10 p-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                </div>
              </div>
              <p className={`mt-2 text-2xl font-bold ${(analytics?.overdueTasks || 0) > 0 ? "text-rose-500" : ""}`}>
                {analytics?.overdueTasks || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Past due date</p>
            </AnimatedCard>

            <AnimatedCard>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                <div className="rounded-lg bg-violet-500/10 p-1.5">
                  <Clock className="h-3.5 w-3.5 text-violet-500" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-violet-500">
                {analytics?.statusBreakdown?.in_progress || analytics?.statusBreakdown?.IN_PROGRESS || 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Actively being worked on</p>
            </AnimatedCard>
          </div>

          {/* Progress + Charts Row */}
          <div className="grid gap-5 xl:grid-cols-3" key={`charts-row1-${chartKey}`}>
            {/* Progress Bar */}
            <AnimatedCard>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-primary/10 p-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Project Completion</h3>
                  <p className="text-[10px] text-muted-foreground">Overall progress</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className={`text-2xl font-bold ${completionRate > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {completionRate}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  key={`progress-bar-${chartKey}`}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  {analytics?.completedTasks || 0} completed
                </span>
                <span className="flex items-center gap-1">
                  <ListTodo className="h-3 w-3 text-muted-foreground" />
                  {analytics?.totalTasks ? analytics.totalTasks - analytics.completedTasks : 0} remaining
                </span>
              </div>
            </AnimatedCard>

            {/* Task Breakdown Pie */}
            <AnimatedCard>
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-sm font-semibold">Task Breakdown</h3>
              </div>
              {pieData.length > 0 ? (
                <div className="h-40" key={`pie-${chartKey}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart key={`pie-chart-${chartKey}`}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                        animationBegin={100}
                        animationDuration={1600}
                        animationEasing="ease-out"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={BarChart3} title="No task data" actionLabel="Create Task" actionOnClick={() => setIsTaskDialogOpen(true)} />
              )}
            </AnimatedCard>

            {/* Priority Distribution */}
            <AnimatedCard>
              <div className="mb-3 flex items-center gap-2">
                <GitPullRequest className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-sm font-semibold">Task Priority</h3>
              </div>
              {priorityData.length > 0 ? (
                <div className="h-40" key={`priority-${chartKey}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priorityData}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                      key={`bar-${chartKey}`}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        className="text-muted-foreground"
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="value"
                        name="Tasks"
                        radius={[0, 4, 4, 0]}
                        animationBegin={200}
                        animationDuration={1200}
                      >
                        {priorityData.map((entry, idx) => (
                          <Cell key={`p-${idx}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState icon={GitPullRequest} title="No priority data" actionLabel="Create Task" actionOnClick={() => setIsTaskDialogOpen(true)} />
              )}
            </AnimatedCard>
          </div>

          {/* Status Distribution + Recent Tasks */}
          <div className="grid gap-5 lg:grid-cols-2" key={`charts-row2-${chartKey}`}>
            {/* Status Distribution */}
            <AnimatedCard>
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-sm font-semibold">Status Distribution</h3>
              </div>
              {statusData.length > 0 ? (
                <div className="space-y-3">
                  {statusData.map((s, idx) => {
                    const maxVal = Math.max(...statusData.map((d) => d.value));
                    const pct = maxVal > 0 ? (s.value / maxVal) * 100 : 0;
                    return (
                      <motion.div
                        key={s.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-20 shrink-0">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-[10px] font-medium">{s.name}</span>
                          </div>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: s.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                              key={`status-${s.name}-${chartKey}`}
                            />
                          </div>
                          <span className="text-xs font-bold w-8 text-right shrink-0">{s.value}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={BarChart3} title="No status data" actionLabel="Create Task" actionOnClick={() => setIsTaskDialogOpen(true)} />
              )}
            </AnimatedCard>

            {/* Recent Tasks */}
            <AnimatedCard>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-semibold">Recent Tasks</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] gap-1 h-7"
                  onClick={() => navigate(`/workspace/${workspaceId}/projects/${projectId}`)}
                >
                  View All <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              {recentTasks.length > 0 ? (
                <div className="space-y-2">
                  {recentTasks.slice(0, 5).map((task, idx) => (
                    <motion.div
                      key={task._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex items-center gap-2 rounded-lg border border-transparent p-2 hover:bg-muted/50 hover:border-border transition-all cursor-pointer"
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          task.status === "DONE"
                            ? "bg-emerald-500"
                            : task.status === "IN_PROGRESS"
                            ? "bg-blue-500"
                            : task.status === "IN_REVIEW"
                            ? "bg-purple-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.taskCode} · {task.assignedTo?.name || "Unassigned"}
                        </p>
                      </div>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), "MMM d")}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground">
                  <ListTodo className="mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p>No tasks yet</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs mt-1"
                    onClick={() => setIsTaskDialogOpen(true)}
                  >
                    Create the first task
                  </Button>
                </div>
              )}
            </AnimatedCard>
          </div>

          {/* Full Task Table */}
          <AnimatedCard>              <div className="mb-3 flex items-center gap-2">
              <ListTodo className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-sm font-semibold">All Project Tasks</h3>
            </div>
            <TaskTable />
          </AnimatedCard>
        </>
      )}

      {/* Create Task Dialog */}
      <Dialog modal={true} open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg border-0 max-h-[90vh] overflow-y-auto">
          <CreateTaskForm onClose={() => setIsTaskDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProjectDashboard;
