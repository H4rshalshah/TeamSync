import { useMemo, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  TrendingUp,
  Loader,
  CheckCircle2,
  AlertCircle,
  Clock,
  ListTodo,
  BarChart3,
  GitPullRequest,
  Activity,
  RefreshCw,
  Layers,
  Users,
} from "lucide-react";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useQuery } from "@tanstack/react-query";
import {
  getWorkspaceCollaborationQueryFn,
  getWorkspaceAnalyticsQueryFn,
} from "@/lib/api";

const COLORS = {
  done: "#22c55e",
  inProgress: "#60a5fa",
  todo: "#facc15",
  backlog: "#94a3b8",
  overdue: "#ef4444",
  low: "#38bdf8",
  medium: "#facc15",
  high: "#fb923c",
  urgent: "#ef4444",
  in_review: "#a855f7",
  unassigned: "#a78bfa",
};

const getBreakdownCount = (
  breakdown: Record<string, number>,
  ...keys: string[]
) => keys.reduce((total, key) => total + (breakdown[key] || 0), 0);

const formatTrendDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  }

  const parts = value.split("-");
  if (parts.length >= 2) {
    const [month, day] = parts.slice(-2);
    return `${day} ${month}`;
  }
  return value;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 14 },
  },
};

function AnimatedCounter({
  value,
  suffix = "",
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 25, stiffness: 120 });
  const rounded = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

const AnimatedCard = ({
  children,
  className = "",
  gradient = false,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) => (
  <motion.div
    variants={itemVariants}
    className={`rounded-xl border bg-card/80 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md ${
      gradient ? "bg-gradient-to-br" : ""
    } ${className}`}
  >
    {children}
  </motion.div>
);

const ProgressBar = ({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div
      ref={ref}
      className={`h-3 w-full overflow-hidden rounded-full bg-muted/60 ${className}`}
    >
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
        initial={{ width: 0 }}
        animate={
          isInView ? { width: `${Math.min(100, Math.max(0, value))}%` } : { width: 0 }
        }
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
      />
    </div>
  );
};

const DonutChart = ({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) => {
  const [activeItem, setActiveItem] = useState<
    { name: string; value: number; color: string } | undefined
  >(undefined);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total <= 0) return null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3">
      <svg
        viewBox="0 0 220 220"
        className="h-44 w-44 overflow-visible"
        role="img"
        aria-label="Task distribution chart"
        onMouseLeave={() => setActiveItem(undefined)}
      >
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth="34"
          opacity="0.35"
        />
        {data.map((item, index) => {
          const segment = (item.value / total) * circumference;
          const dashOffset = -offset;
          offset += segment;

          return (
            <motion.circle
              key={item.name}
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={activeItem?.name === item.name ? "38" : "34"}
              strokeLinecap="butt"
              strokeDasharray={`${segment} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 110 110)"
              initial={{ opacity: 0 }}
              animate={{
                opacity: activeItem && activeItem.name !== item.name ? 0.55 : 1,
              }}
              transition={{
                duration: 0.55,
                delay: 0.12 * index,
                ease: "easeOut",
              }}
              style={{
                cursor: "pointer",
                filter:
                  activeItem?.name === item.name
                    ? `drop-shadow(0 0 12px ${item.color})`
                    : "none",
              }}
              onMouseEnter={() => setActiveItem(item)}
              onFocus={() => setActiveItem(item)}
            >
              <title>{`${item.name}: ${item.value}`}</title>
            </motion.circle>
          );
        })}
        <text
          x="110"
          y="104"
          textAnchor="middle"
          className="fill-foreground text-xl font-bold"
        >
          {total}
        </text>
        <text
          x="110"
          y="128"
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          total tasks
        </text>
      </svg>
      <div className="min-h-5 text-center text-xs font-semibold">
        {activeItem ? (
          <span style={{ color: activeItem.color }}>
            {activeItem.name}: {activeItem.value} tasks
          </span>
        ) : (
          <span className="text-muted-foreground">Hover ring to inspect</span>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PriorityBars = ({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) => {
  const [activeItem, setActiveItem] = useState(data[0]);
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div
      className="flex h-full flex-col justify-center gap-4"
      onMouseLeave={() => setActiveItem(data[0])}
    >
      {data.map((item, index) => {
        const width = Math.max(12, (item.value / max) * 100);

        return (
          <div key={item.name} className="grid gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">{item.name}</span>
              <span
                className="rounded-full px-2 py-0.5 font-semibold"
                style={{
                  color: item.color,
                  backgroundColor: `${item.color}18`,
                }}
              >
                {item.value} tasks
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-muted/40">
              <motion.div
                className="h-full rounded-full shadow-[0_0_18px_rgba(99,102,241,0.22)]"
                style={{ backgroundColor: item.color }}
                initial={{ width: 0 }}
                animate={{
                  width: `${width}%`,
                  opacity: activeItem?.name === item.name ? 1 : 0.72,
                }}
                transition={{
                  duration: 1,
                  delay: 0.12 * index,
                  ease: "easeOut",
                }}
                onMouseEnter={() => setActiveItem(item)}
                title={`${item.name}: ${item.value} tasks`}
              />
            </div>
          </div>
        );
      })}
      <div className="min-h-5 text-center text-xs font-semibold">
        <span style={{ color: activeItem?.color }}>
          {activeItem?.name}: {activeItem?.value} tasks
        </span>
      </div>
    </div>
  );
};

const buildLinePath = (
  values: number[],
  maxValue: number,
  width: number,
  height: number,
  padding: number
) => {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const divisor = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + (index / divisor) * innerWidth;
      const y =
        padding + innerHeight - (value / Math.max(maxValue, 1)) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};

const buildAreaPath = (
  values: number[],
  maxValue: number,
  width: number,
  height: number,
  padding: number
) => {
  const linePath = buildLinePath(values, maxValue, width, height, padding);
  return `${linePath} L ${width - padding} ${height - padding} L ${padding} ${
    height - padding
  } Z`;
};

const VelocityChart = ({
  data,
}: {
  data: Array<{ date: string; Created: number; Completed: number }>;
}) => {
  const [activePoint, setActivePoint] = useState<{
    label: string;
    value: number;
    color: string;
    x: number;
  } | null>(null);
  const fallbackData = Array.from({ length: 14 }, (_, index) => ({
    date: `${index + 1}`,
    Created: 0,
    Completed: 0,
  }));
  const chartData = data.length > 0 ? data : fallbackData;
  const width = 520;
  const height = 230;
  const padding = 28;
  const maxValue = Math.max(
    ...chartData.flatMap((item) => [item.Created, item.Completed]),
    1
  );
  const createdPath = buildLinePath(
    chartData.map((item) => item.Created),
    maxValue,
    width,
    height,
    padding
  );
  const completedPath = buildLinePath(
    chartData.map((item) => item.Completed),
    maxValue,
    width,
    height,
    padding
  );
  const createdArea = buildAreaPath(
    chartData.map((item) => item.Created),
    maxValue,
    width,
    height,
    padding
  );
  const completedArea = buildAreaPath(
    chartData.map((item) => item.Completed),
    maxValue,
    width,
    height,
    padding
  );
  const hasActivity = chartData.some(
    (item) => item.Created > 0 || item.Completed > 0
  );
  const getPointForIndex = (index: number) => {
    const item = chartData[index];
    const divisor = Math.max(chartData.length - 1, 1);
    const x = padding + (index / divisor) * (width - padding * 2);
    const createdY =
      padding +
      (height - padding * 2) -
      (item.Created / Math.max(maxValue, 1)) * (height - padding * 2);
    const completedY =
      padding +
      (height - padding * 2) -
      (item.Completed / Math.max(maxValue, 1)) * (height - padding * 2);
    const isCreatedFocus = item.Created >= item.Completed;

    return {
      label: `${item.date}: ${item.Created} created, ${item.Completed} completed`,
      value: isCreatedFocus ? item.Created : item.Completed,
      color: isCreatedFocus ? "#3b82f6" : "#22c55e",
      x,
      createdY,
      completedY,
    };
  };

  const handleChartHover = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (chartData.length - 1));
    setActivePoint(getPointForIndex(index));
  };

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-52 w-full overflow-visible"
        role="img"
        aria-label="Task velocity chart"
        onMouseLeave={() => setActivePoint(null)}
      >
        <defs>
          <linearGradient id="velocityCreated" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="velocityCompleted" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line
          x1={padding}
          x2={padding}
          y1={padding}
          y2={height - padding}
          stroke="hsl(var(--border))"
          strokeWidth="2"
          opacity="0.72"
        />
        {activePoint && (
          <motion.line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padding}
            y2={height - padding}
            stroke={activePoint.color}
            strokeDasharray="4 6"
            opacity="0.7"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          />
        )}
        <motion.path
          d={createdArea}
          fill="url(#velocityCreated)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.path
          d={completedArea}
          fill="url(#velocityCompleted)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }}
        />
        <motion.path
          d={createdPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <motion.path
          d={completedPath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        />
        {chartData.map((item, index) => {
          const shouldShowLabel =
            index === 0 || index === chartData.length - 1 || index % 3 === 0;
          if (!shouldShowLabel) return null;
          const divisor = Math.max(chartData.length - 1, 1);
          const x = padding + (index / divisor) * (width - padding * 2);
          return (
            <text
              key={`date-${item.date}-${index}`}
              x={x}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {item.date}
            </text>
          );
        })}
        {chartData.map((item, index) => {
          const point = getPointForIndex(index);

          return (
            <g key={`${item.date}-${index}`}>
              <motion.circle
                cx={point.x}
                cy={point.createdY}
                r="5"
                fill="#3b82f6"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.35 + index * 0.025, duration: 0.25 }}
                onMouseEnter={() =>
                  setActivePoint({
                    label: `${item.date} created`,
                    value: item.Created,
                    color: "#3b82f6",
                    x: point.x,
                  })
                }
              >
                <title>{`${item.date} created: ${item.Created}`}</title>
              </motion.circle>
              <motion.circle
                cx={point.x}
                cy={point.completedY}
                r="5"
                fill="#22c55e"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.45 + index * 0.025, duration: 0.25 }}
                onMouseEnter={() =>
                  setActivePoint({
                    label: `${item.date} completed`,
                    value: item.Completed,
                    color: "#22c55e",
                    x: point.x,
                  })
                }
              >
                <title>{`${item.date} completed: ${item.Completed}`}</title>
              </motion.circle>
            </g>
          );
        })}
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseMove={handleChartHover}
          onMouseEnter={handleChartHover}
        />
        {!hasActivity && (
          <text
            x={width / 2}
            y={height / 2 - 6}
            textAnchor="middle"
            className="fill-muted-foreground text-sm font-semibold"
          >
            No recent task movement
          </text>
        )}
      </svg>
      <div className="min-h-5 text-center text-xs font-semibold">
        {activePoint ? (
          <span style={{ color: activePoint.color }}>{activePoint.label}</span>
        ) : (
          <span className="text-muted-foreground">Hover chart to inspect</span>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          Created
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      </div>
    </div>
  );
};

const AnalyticsCharts = () => {
  const workspaceId = useWorkspaceId();
  const [trendChartKey, setTrendChartKey] = useState(0);

  const { data: collabData, isPending: collabLoading } = useQuery({
    queryKey: ["workspace-collaboration", workspaceId],
    queryFn: () => getWorkspaceCollaborationQueryFn(workspaceId),
    enabled: !!workspaceId,
  });

  const {
    data: analyticsData,
    isPending: analyticsLoading,
    isFetching,
  } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: () => getWorkspaceAnalyticsQueryFn(workspaceId),
    staleTime: 0,
    refetchInterval: 30000,
    enabled: !!workspaceId,
  });

  const isLoading = collabLoading || analyticsLoading;
  const summary = collabData?.summary;
  const analytics = analyticsData?.analytics;
  const memberProgress = collabData?.memberProgress || [];

  useEffect(() => {
    if (!isFetching) {
      const timer = setTimeout(() => setTrendChartKey((k) => k + 1), 100);
      return () => clearTimeout(timer);
    }
  }, [analyticsData, isFetching]);

  const remainingTasks = summary
    ? summary.totalTasks -
      summary.doneTasks -
      summary.inProgressTasks -
      summary.blockedOrBacklogTasks
    : 0;

  const pieData = useMemo(() => {
    if (!summary) return [];
    const data = [
      { name: "Done", value: summary.doneTasks, color: COLORS.done },
      {
        name: "In Progress",
        value: summary.inProgressTasks,
        color: COLORS.inProgress,
      },
      {
        name: "Blocked/Backlog",
        value: summary.blockedOrBacklogTasks,
        color: COLORS.backlog,
      },
    ];
    if (remainingTasks > 0) {
      data.push({
        name: "Remaining",
        value: remainingTasks,
        color: COLORS.todo,
      });
    }
    return data.filter((d) => d.value > 0);
  }, [summary, remainingTasks]);

  const priorityData = useMemo(() => {
    if (!analytics?.priorityBreakdown) return [];
    const p = analytics.priorityBreakdown;
    const data = [
      {
        name: "High",
        value: getBreakdownCount(p, "high", "HIGH"),
        color: COLORS.high,
      },
      {
        name: "Medium",
        value: getBreakdownCount(p, "medium", "MEDIUM"),
        color: COLORS.medium,
      },
      {
        name: "Low",
        value: getBreakdownCount(p, "low", "LOW"),
        color: COLORS.low,
      },
    ].filter((d) => d.value > 0);

    if (data.length > 0) return data;

    const totalTasks = analytics.totalTasks || summary?.totalTasks || 0;
    return totalTasks > 0
      ? [{ name: "Unassigned", value: totalTasks, color: COLORS.unassigned }]
      : [];
  }, [analytics, summary]);

  const projectData = useMemo(() => {
    if (!analytics?.tasksByProject || analytics.tasksByProject.length === 0) return [];
    return analytics.tasksByProject.slice(0, 8).map((p) => ({
      name: p.name,
      total: p.count,
      completed: p.completed,
      remaining: Math.max(0, p.count - p.completed),
      progress: p.count ? Math.round((p.completed / p.count) * 100) : 0,
      emoji: p.emoji || "📋",
    }));
  }, [analytics]);

  const trendData = useMemo(() => {
    if (!analytics?.trends) return [];
    return analytics.trends.map((t) => ({
      date: formatTrendDate(t.date),
      Created: t.created,
      Completed: t.completed,
    }));
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="relative">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-5"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatedCard
          gradient
          className="border-blue-200/20 from-blue-500/5 to-cyan-500/5 dark:border-blue-800/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <ListTodo className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold">
            <AnimatedCounter value={analytics?.totalTasks || 0} />
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </div>
        </AnimatedCard>

        <AnimatedCard
          gradient
          className="border-emerald-200/20 from-emerald-500/5 to-teal-500/5 dark:border-emerald-800/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-500">
            <AnimatedCounter value={analytics?.completedTasks || 0} />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {analytics?.totalTasks
              ? `${Math.round(
                  (analytics.completedTasks / analytics.totalTasks) * 100
                )}% completion rate`
              : "No tasks yet"}
          </p>
        </AnimatedCard>

        <AnimatedCard
          gradient
          className="border-rose-200/20 from-rose-500/5 to-pink-500/5 dark:border-rose-800/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Overdue</p>
            <div className="rounded-lg bg-rose-500/10 p-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-rose-500">
            <AnimatedCounter value={analytics?.overdueTasks || 0} />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Past due date</p>
        </AnimatedCard>

        <AnimatedCard
          gradient
          className="border-violet-200/20 from-violet-500/5 to-purple-500/5 dark:border-violet-800/20"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
            <div className="rounded-lg bg-violet-500/10 p-2">
              <Clock className="h-4 w-4 text-violet-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-violet-500">
            <AnimatedCounter value={summary?.inProgressTasks || 0} />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Actively being worked on
          </p>
        </AnimatedCard>
      </div>

      <AnimatedCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Overall Project Completion</h3>
              <p className="text-xs text-muted-foreground">
                Real-time progress tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isFetching && (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            <span className="text-2xl font-bold text-primary">
              {summary?.progress || 0}%
            </span>
          </div>
        </div>
        <ProgressBar value={summary?.progress || 0} className="mt-4" />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {summary?.doneTasks || 0} tasks done
          </span>
          <span className="flex items-center gap-1">
            <ListTodo className="h-3 w-3 text-muted-foreground" />
            {summary?.remainingTasks || 0} remaining
          </span>
        </div>
      </AnimatedCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <AnimatedCard>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Task Distribution</h3>
          </div>
          {pieData.length > 0 ? (
            <div className="dashboard-chart-frame h-64 min-h-[256px] w-full">
              <DonutChart data={pieData} />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p>No task data available yet</p>
              </div>
            </div>
          )}
        </AnimatedCard>

        <AnimatedCard>
          <div className="mb-4 flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Priority Distribution</h3>
          </div>
          {priorityData.length > 0 ? (
            <div className="dashboard-chart-frame h-64 min-h-[256px] w-full">
              <PriorityBars data={priorityData} />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <GitPullRequest className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p>No priority data</p>
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AnimatedCard>
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Tasks by Project</h3>
          </div>
          {projectData.length > 0 ? (
            <div className="space-y-3">
              {projectData.map((project, index) => (
                <motion.div
                  key={`${project.name}-${index}`}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.08,
                    type: "spring",
                    stiffness: 110,
                  }}
                  className="rounded-lg border bg-muted/20 p-3.5 transition-colors hover:bg-muted/35"
                >
                  <div className="mb-2.5 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-base shadow-sm">
                        {project.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {project.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project.completed} done · {project.remaining} left
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {project.progress}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{
                        duration: 1.1,
                        delay: 0.15 + index * 0.07,
                        ease: "easeOut",
                      }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.total} total tasks</span>
                    <span>
                      {project.completed}/{project.total} completed
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              <div className="text-center">
                <Layers className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p>No project data available</p>
              </div>
            </div>
          )}
        </AnimatedCard>

        <AnimatedCard>
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Task Velocity (14 days)</h3>
          </div>
          {trendData.length > 0 ? (
            <div
              className="dashboard-chart-frame h-64 min-h-[256px] w-full"
              key={trendChartKey}
            >
              <VelocityChart data={trendData} />
            </div>
          ) : (
            <div className="dashboard-chart-frame h-64 min-h-[256px] w-full">
              <VelocityChart data={[]} />
            </div>
          )}
        </AnimatedCard>
      </div>

      {memberProgress.length > 0 && (
        <AnimatedCard>
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Team Progress Overview</h3>
              <p className="text-xs text-muted-foreground">
                Individual member task completion
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {memberProgress.map((member, index) => (
              <motion.div
                key={member.memberId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
                className="group rounded-lg border bg-muted/20 p-3.5 transition-all duration-200 hover:border-primary/20 hover:bg-muted/40 hover:shadow-sm"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold">
                      {member.user?.name?.split(" ")[0] || "Unknown"}
                    </span>
                  </div>
                  <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {member.completedTasks}/{member.assignedTasks}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${member.progress}%` }}
                    transition={{
                      duration: 1.2,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{member.progress}%</span>
                  <span>{member.remainingTasks} remaining</span>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      )}
    </motion.div>
  );
};

export default AnalyticsCharts;
