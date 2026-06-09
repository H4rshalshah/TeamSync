import mongoose from "mongoose";
import ProjectModel from "../models/project.model";
import TaskModel from "../models/task.model";
import { NotFoundException } from "../utils/appError";
import { TaskStatusEnum } from "../enums/task.enum";

export const createProjectService = async (
  userId: string,
  workspaceId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
  }
) => {
  const project = new ProjectModel({
    ...(body.emoji && { emoji: body.emoji }),
    name: body.name,
    description: body.description,
    workspace: workspaceId,
    createdBy: userId,
  });

  await project.save();

  return { project };
};

export const getProjectsInWorkspaceService = async (
  workspaceId: string,
  pageSize: number,
  pageNumber: number
) => {
  // Step 1: Find all projects in the workspace

  const totalCount = await ProjectModel.countDocuments({
    workspace: workspaceId,
  });

  const skip = (pageNumber - 1) * pageSize;

  const projects = await ProjectModel.find({
    workspace: workspaceId,
  })
    .skip(skip)
    .limit(pageSize)
    .populate("createdBy", "_id name profilePicture -password")
    .sort({ createdAt: -1 });

  const totalPages = Math.ceil(totalCount / pageSize);

  return { projects, totalCount, totalPages, skip };
};

export const getProjectByIdAndWorkspaceIdService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  }).select("_id emoji name description");

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  return { project };
};

export const getProjectAnalyticsService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await ProjectModel.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const currentDate = new Date();
  const projectMatch = { project: new mongoose.Types.ObjectId(projectId) };

  // Basic analytics using aggregate
  const taskAnalytics = await TaskModel.aggregate([
    { $match: projectMatch },
    {
      $facet: {
        totalTasks: [{ $count: "count" }],
        overdueTasks: [
          {
            $match: {
              dueDate: { $lt: currentDate },
              status: { $ne: TaskStatusEnum.DONE },
            },
          },
          { $count: "count" },
        ],
        completedTasks: [
          { $match: { status: TaskStatusEnum.DONE } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const _analytics = taskAnalytics[0];

  // Priority breakdown
  const priorityBreakdown = await TaskModel.aggregate([
    { $match: projectMatch },
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);

  const priorityMap: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };
  priorityBreakdown.forEach((p) => {
    const key = String(p._id || "").toLowerCase();
    if (key) priorityMap[key] = p.count;
  });

  // Status breakdown
  const statusBreakdown = await TaskModel.aggregate([
    { $match: projectMatch },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const statusMap: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  };
  statusBreakdown.forEach((s) => {
    const key = String(s._id || "").toLowerCase();
    if (key) statusMap[key] = s.count;
  });

  // Task trends — created per day for last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const taskTrends = await TaskModel.aggregate([
    {
      $match: {
        ...projectMatch,
        createdAt: { $gte: fourteenDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        created: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ["$status", TaskStatusEnum.DONE] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 14 },
  ]);

  // Fill in missing dates
  const trendsMap: Record<string, { created: number; completed: number }> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    trendsMap[key] = { created: 0, completed: 0 };
  }
  taskTrends.forEach((t) => {
    if (trendsMap[t._id]) {
      trendsMap[t._id].created = t.created;
      trendsMap[t._id].completed = t.completed;
    }
  });
  const trends = Object.entries(trendsMap).map(([date, data]) => ({
    date,
    ...data,
  }));

  const analytics = {
    totalTasks: _analytics.totalTasks[0]?.count || 0,
    overdueTasks: _analytics.overdueTasks[0]?.count || 0,
    completedTasks: _analytics.completedTasks[0]?.count || 0,
    priorityBreakdown: priorityMap,
    statusBreakdown: statusMap,
    tasksByProject: [], // Not applicable for single project
    trends,
  };

  return { analytics };
};

export const updateProjectService = async (
  workspaceId: string,
  projectId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
  }
) => {
  const { name, emoji, description } = body;

  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  if (emoji) project.emoji = emoji;
  if (name) project.name = name;
  if (description) project.description = description;

  await project.save();

  return { project };
};

export const deleteProjectService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await ProjectModel.findOne({
    _id: projectId,
    workspace: workspaceId,
  });

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  await project.deleteOne();

  await TaskModel.deleteMany({
    project: project._id,
  });

  return project;
};
