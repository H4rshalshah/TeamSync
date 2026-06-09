// @ts-nocheck
import { Router, Request, Response, NextFunction } from "express";
import { isLocalDemoMode } from "../utils/local-demo-mode";
import { RolePermissions } from "../utils/role-permission";

const localDemoRoutes = Router() as any;

const now = () => new Date().toISOString();
const userId = "demo-user-001";
const workspaceId = "demo-workspace-001";
const ownerRoleId = "demo-role-owner";
const memberId = "demo-member-001";

const roles = [
  { _id: ownerRoleId, name: "OWNER" },
  { _id: "demo-role-admin", name: "ADMIN" },
  { _id: "demo-role-member", name: "MEMBER" },
];

const demoUser = {
  _id: userId,
  name: "Local User",
  email: "local@example.com",
  profilePicture: null,
  isActive: true,
  lastLogin: null,
  createdAt: now(),
  updatedAt: now(),
  currentWorkspace: workspaceId,
};

const demoWorkspace = {
  _id: workspaceId,
  name: "My Workspace",
  description: "Local workspace for trying TeamSync",
  owner: userId,
  inviteCode: "LOCAL-DEMO",
  invitePassword: "LOCALPASS1",
  createdAt: now(),
  updatedAt: now(),
};

const demoMember = {
  _id: memberId,
  userId: {
    _id: userId,
    name: demoUser.name,
    email: demoUser.email,
    profilePicture: null,
  },
  workspaceId,
  role: roles[0],
  joinedAt: now(),
  createdAt: now(),
};

let projects: any[] = [
  {
    _id: "demo-project-001",
    name: "Website Launch",
    emoji: "🚀",
    description: "Plan launch tasks, owners, reviews, and delivery progress.",
    workspace: workspaceId,
    createdBy: {
      _id: userId,
      name: demoUser.name,
      profilePicture: "",
    },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: "demo-project-002",
    name: "Product Roadmap",
    emoji: "📌",
    description: "Track upcoming features and team priorities.",
    workspace: workspaceId,
    createdBy: {
      _id: userId,
      name: demoUser.name,
      profilePicture: "",
    },
    createdAt: now(),
    updatedAt: now(),
  },
];

let tasks: any[] = [
  {
    _id: "demo-task-001",
    title: "Create landing page copy",
    description: "Prepare headline, supporting copy, and CTA text.",
    project: {
      _id: projects[0]._id,
      emoji: projects[0].emoji,
      name: projects[0].name,
    },
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTo: {
      _id: userId,
      name: demoUser.name,
      profilePicture: null,
    },
    createdBy: userId,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    taskCode: "TS-1",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: "demo-task-002",
    title: "Review analytics cards",
    description: "Check workspace analytics and project dashboard states.",
    project: {
      _id: projects[1]._id,
      emoji: projects[1].emoji,
      name: projects[1].name,
    },
    priority: "MEDIUM",
    status: "TODO",
    assignedTo: {
      _id: userId,
      name: demoUser.name,
      profilePicture: null,
    },
    createdBy: userId,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    taskCode: "TS-2",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: "demo-task-003",
    title: "Finalize local auth flow",
    description: "Make sure signup, login, and protected routes work locally.",
    project: {
      _id: projects[0]._id,
      emoji: projects[0].emoji,
      name: projects[0].name,
    },
    priority: "HIGH",
    status: "DONE",
    assignedTo: {
      _id: userId,
      name: demoUser.name,
      profilePicture: null,
    },
    createdBy: userId,
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    taskCode: "TS-3",
    createdAt: now(),
    updatedAt: now(),
  },
];

let collaborationEntries: any[] = [
  {
    _id: "demo-update-001",
    workspace: workspaceId,
    author: demoMember.userId,
    kind: "UPDATE",
    message: "Landing page copy is in progress. Hero and CTA are ready, final proofing is left.",
    progress: 65,
    blocker: "",
    project: { _id: projects[0]._id, name: projects[0].name, emoji: projects[0].emoji },
    task: { _id: tasks[0]._id, title: tasks[0].title, taskCode: tasks[0].taskCode, status: tasks[0].status },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    _id: "demo-chat-001",
    workspace: workspaceId,
    author: demoMember.userId,
    kind: "CHAT",
    message: "Team, please share blockers here before the daily sync.",
    progress: null,
    blocker: "",
    project: null,
    task: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const pagination = (totalCount: number, pageSize = 10, pageNumber = 1) => ({
  totalCount,
  pageSize,
  pageNumber,
  totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  skip: (pageNumber - 1) * pageSize,
  limit: pageSize,
});

const demoSession = (req: Request) => {
  const session = req.session as any;
  return session?.demoUser;
};

const setDemoSession = (req: Request, body?: { name?: string; email?: string }) => {
  const session = (req.session ||= {}) as any;
  session.demoUser = {
    ...demoUser,
    name: body?.name || demoUser.name,
    email: body?.email || demoUser.email,
  };
  return session.demoUser;
};

localDemoRoutes.use((req: Request, res: Response, next: NextFunction) => {
  if (!isLocalDemoMode()) return next("router");
  return next();
});

localDemoRoutes.post("/auth/register", (req, res) => {
  setDemoSession(req, req.body);
  return res.status(201).json({ message: "User created successfully" });
});

localDemoRoutes.post("/auth/login", (req, res) => {
  const user = setDemoSession(req, req.body);
  return res.status(200).json({
    message: "Logged in successfully",
    user: {
      ...user,
      currentWorkspace: workspaceId,
    },
  });
});

localDemoRoutes.post("/auth/logout", (req, res) => {
  const session = req.session as any;
  if (session) delete session.demoUser;
  return res.status(200).json({ message: "Logged out successfully" });
});

localDemoRoutes.post("/auth/invite/:inviteCode/validate", (req, res) => {
  if (req.params.inviteCode !== demoWorkspace.inviteCode) {
    return res.status(404).json({ message: "Invalid invite code or workspace not found" });
  }

  if (req.body?.invitePassword !== demoWorkspace.invitePassword) {
    return res.status(400).json({ message: "Invalid invite password" });
  }

  return res.status(200).json({
    message: "Invite password verified",
    workspaceId,
    workspaceName: demoWorkspace.name,
  });
});

localDemoRoutes.use((req, res, next) => {
  if (req.path.startsWith("/auth")) return next();
  if (!demoSession(req)) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }
  return next();
});

localDemoRoutes.get("/user/current", (req, res) => {
  const user = demoSession(req);
  return res.status(200).json({
    message: "User fetch successfully",
    user: {
      ...user,
      currentWorkspace: demoWorkspace,
    },
  });
});

localDemoRoutes.get("/workspace/all", (req, res) => {
  return res.status(200).json({
    message: "User workspaces fetched successfully",
    workspaces: [demoWorkspace],
  });
});

localDemoRoutes.get("/workspace/members/:id", (req, res) => {
  return res.status(200).json({
    message: "Workspace members retrieved successfully",
    members: [demoMember],
    roles,
  });
});

localDemoRoutes.get("/workspace/analytics/:id", (req, res) => {
  return res.status(200).json({
    message: "Workspace analytics retrieved successfully",
    analytics: {
      totalTasks: tasks.length,
      overdueTasks: tasks.filter((task) => new Date(task.dueDate) < new Date() && task.status !== "DONE").length,
      completedTasks: tasks.filter((task) => task.status === "DONE").length,
    },
  });
});

localDemoRoutes.get("/workspace/:id", (req, res) => {
  return res.status(200).json({
    message: "Workspace fetched successfully",
    workspace: {
      ...demoWorkspace,
      members: [
        {
          _id: memberId,
          userId,
          workspaceId,
          role: {
            _id: ownerRoleId,
            name: "OWNER",
            permissions: RolePermissions.OWNER,
          },
          joinedAt: now(),
          createdAt: now(),
        },
      ],
    },
  });
});

localDemoRoutes.post("/member/workspace/:inviteCode/join", (req, res) => {
  if (req.body?.invitePassword !== demoWorkspace.invitePassword) {
    return res.status(400).json({ message: "Invalid invite password" });
  }

  return res.status(200).json({
    message: "Successfully joined the workspace",
    workspaceId,
    role: roles[0],
  });
});

localDemoRoutes.post("/workspace/create/new", (req, res) => {
  return res.status(201).json({
    message: "Workspace created successfully",
    workspace: {
      ...demoWorkspace,
      _id: `demo-workspace-${Date.now()}`,
      name: req.body?.name || "New Workspace",
      description: req.body?.description || "",
      invitePassword: "LOCALPASS1",
    },
  });
});

localDemoRoutes.put("/workspace/update/:id", (req, res) => {
  Object.assign(demoWorkspace, {
    name: req.body?.name || demoWorkspace.name,
    description: req.body?.description || demoWorkspace.description,
    updatedAt: now(),
  });
  return res.status(200).json({
    message: "Workspace updated successfully",
    workspace: demoWorkspace,
  });
});

localDemoRoutes.put("/workspace/change/member/role/:id", (req, res) => {
  demoMember.role = roles.find((role) => role._id === req.body?.roleId) || demoMember.role;
  return res.status(200).json({
    message: "Member Role changed successfully",
    member: demoMember,
  });
});

localDemoRoutes.get("/project/workspace/:workspaceId/all", (req, res) => {
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const pageNumber = parseInt(req.query.pageNumber as string) || 1;
  return res.status(200).json({
    message: "Project fetched successfully",
    projects,
    pagination: pagination(projects.length, pageSize, pageNumber),
  });
});

localDemoRoutes.post("/project/workspace/:workspaceId/create", (req, res) => {
  const project = {
    _id: `demo-project-${Date.now()}`,
    name: req.body?.name || "New Project",
    emoji: req.body?.emoji || "📁",
    description: req.body?.description || "",
    workspace: workspaceId,
    createdBy: {
      _id: userId,
      name: demoSession(req).name,
      profilePicture: "",
    },
    createdAt: now(),
    updatedAt: now(),
  };
  projects = [project, ...projects];
  return res.status(201).json({ message: "Project created successfully", project });
});

localDemoRoutes.get("/project/:id/workspace/:workspaceId/analytics", (req, res) => {
  const projectTasks = tasks.filter((task) => task.project?._id === req.params.id);
  return res.status(200).json({
    message: "Project analytics retrieved successfully",
    analytics: {
      totalTasks: projectTasks.length,
      overdueTasks: projectTasks.filter((task) => new Date(task.dueDate) < new Date() && task.status !== "DONE").length,
      completedTasks: projectTasks.filter((task) => task.status === "DONE").length,
    },
  });
});

localDemoRoutes.get("/project/:id/workspace/:workspaceId", (req, res) => {
  const project = projects.find((item) => item._id === req.params.id) || projects[0];
  return res.status(200).json({ message: "Project fetched successfully", project });
});

localDemoRoutes.put("/project/:id/workspace/:workspaceId/update", (req, res) => {
  projects = projects.map((project) =>
    project._id === req.params.id
      ? { ...project, ...req.body, updatedAt: now() }
      : project
  );
  return res.status(200).json({
    message: "Project updated successfully",
    project: projects.find((project) => project._id === req.params.id) || projects[0],
  });
});

localDemoRoutes.delete("/project/:id/workspace/:workspaceId/delete", (req, res) => {
  projects = projects.filter((project) => project._id !== req.params.id);
  tasks = tasks.filter((task) => task.project?._id !== req.params.id);
  return res.status(200).json({ message: "Project deleted successfully" });
});

localDemoRoutes.get("/task/workspace/:workspaceId/all", (req, res) => {
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const pageNumber = parseInt(req.query.pageNumber as string) || 1;
  const projectId = req.query.projectId as string | undefined;
  const listFromQuery = (value?: any) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const statuses = listFromQuery(req.query.status);
  const priorities = listFromQuery(req.query.priority);
  const assignees = listFromQuery(req.query.assignedTo);
  const keyword = String(req.query.keyword || "").trim().toLowerCase();

  const filteredTasks = tasks.filter((task) => {
    const matchesProject = !projectId || task.project?._id === projectId;
    const matchesStatus = statuses.length === 0 || statuses.includes(task.status);
    const matchesPriority = priorities.length === 0 || priorities.includes(task.priority);
    const matchesAssignee =
      assignees.length === 0 || (task.assignedTo?._id && assignees.includes(task.assignedTo._id));
    const matchesKeyword =
      !keyword ||
      task.title.toLowerCase().includes(keyword) ||
      String(task.description || "").toLowerCase().includes(keyword);

    return matchesProject && matchesStatus && matchesPriority && matchesAssignee && matchesKeyword;
  });
  return res.status(200).json({
    message: "All tasks fetched successfully",
    tasks: filteredTasks,
    pagination: pagination(filteredTasks.length, pageSize, pageNumber),
  });
});

localDemoRoutes.post("/task/project/:projectId/workspace/:workspaceId/create", (req, res) => {
  const project = projects.find((item) => item._id === req.params.projectId) || projects[0];
  const task = {
    _id: `demo-task-${Date.now()}`,
    title: req.body?.title || "New Task",
    description: req.body?.description || "",
    project: {
      _id: project._id,
      emoji: project.emoji,
      name: project.name,
    },
    priority: req.body?.priority || "MEDIUM",
    status: req.body?.status || "TODO",
    assignedTo: req.body?.assignedTo
      ? { _id: userId, name: demoSession(req).name, profilePicture: null }
      : null,
    createdBy: userId,
    dueDate: req.body?.dueDate || new Date().toISOString(),
    taskCode: `TS-${tasks.length + 1}`,
    createdAt: now(),
    updatedAt: now(),
  };
  tasks = [task, ...tasks];
  return res.status(200).json({ message: "Task created successfully", task });
});

localDemoRoutes.get("/task/:id/project/:projectId/workspace/:workspaceId", (req, res) => {
  const task = tasks.find((item) => item._id === req.params.id) || tasks[0];
  return res.status(200).json({ message: "Task fetched successfully", task });
});

localDemoRoutes.put("/task/:id/project/:projectId/workspace/:workspaceId/update", (req, res) => {
  tasks = tasks.map((task) =>
    task._id === req.params.id ? { ...task, ...req.body, updatedAt: now() } : task
  );
  return res.status(200).json({
    message: "Task updated successfully",
    task: tasks.find((task) => task._id === req.params.id) || tasks[0],
  });
});

localDemoRoutes.delete("/task/:id/workspace/:workspaceId/delete", (req, res) => {
  tasks = tasks.filter((task) => task._id !== req.params.id);
  return res.status(200).json({ message: "Task deleted successfully" });
});

localDemoRoutes.get("/collaboration/workspace/:workspaceId", (req, res) => {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.status === "DONE").length;
  const assignedTasks = tasks.filter((task) => task.assignedTo?._id === userId);
  const completedTasks = assignedTasks.filter((task) => task.status === "DONE").length;

  return res.status(200).json({
    message: "Workspace collaboration fetched successfully",
    summary: {
      totalTasks,
      doneTasks,
      inProgressTasks: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      remainingTasks: totalTasks - doneTasks,
      blockedOrBacklogTasks: tasks.filter((task) => task.status === "BACKLOG").length,
      progress: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    },
    memberProgress: [
      {
        memberId,
        user: demoMember.userId,
        role: demoMember.role,
        assignedTasks: assignedTasks.length,
        completedTasks,
        remainingTasks: assignedTasks.length - completedTasks,
        progress: assignedTasks.length ? Math.round((completedTasks / assignedTasks.length) * 100) : 0,
        latestUpdate:
          collaborationEntries.find((entry) => entry.kind === "UPDATE" && entry.author?._id === userId) || null,
      },
    ],
    updates: collaborationEntries.filter((entry) => entry.kind === "UPDATE"),
    chats: collaborationEntries.filter((entry) => entry.kind === "CHAT").reverse(),
  });
});

localDemoRoutes.post("/collaboration/workspace/:workspaceId/entry", (req, res) => {
  const entry = {
    _id: `demo-entry-${Date.now()}`,
    workspace: workspaceId,
    author: demoMember.userId,
    kind: req.body?.kind || "CHAT",
    message: req.body?.message || "",
    progress: req.body?.progress ?? null,
    blocker: req.body?.blocker || "",
    project: projects.find((project) => project._id === req.body?.projectId) || null,
    task: tasks.find((task) => task._id === req.body?.taskId) || null,
    createdAt: now(),
    updatedAt: now(),
  };
  collaborationEntries = [entry, ...collaborationEntries];
  return res.status(201).json({
    message: "Collaboration entry created successfully",
    entry,
  });
});

localDemoRoutes.delete("/collaboration/workspace/:workspaceId/entry/:entryId", (req, res) => {
  collaborationEntries = collaborationEntries.filter((entry) => entry._id !== req.params.entryId);
  return res.status(200).json({ message: "Entry deleted successfully", entryId: req.params.entryId });
});

localDemoRoutes.delete("/collaboration/workspace/:workspaceId/entries", (req, res) => {
  const kind = req.body?.kind;
  const windowValue = req.body?.window;
  const durationMs =
    windowValue === "1h"
      ? 60 * 60 * 1000
      : windowValue === "24h"
        ? 24 * 60 * 60 * 1000
        : 7 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - durationMs;
  const before = collaborationEntries.length;
  collaborationEntries = collaborationEntries.filter(
    (entry) => entry.kind !== kind || new Date(entry.createdAt).getTime() < cutoff
  );
  return res.status(200).json({
    message: "Entries deleted successfully",
    deletedCount: before - collaborationEntries.length,
  });
});

localDemoRoutes.delete("/collaboration/workspace/:workspaceId/member/:memberUserId", (req, res) => {
  return res.status(400).json({ message: "Demo owner cannot be removed" });
});

export default localDemoRoutes;
