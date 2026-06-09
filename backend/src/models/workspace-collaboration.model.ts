import mongoose, { Document, Schema } from "mongoose";

export type CollaborationKind = "UPDATE" | "CHAT";

export interface WorkspaceCollaborationDocument extends Document {
  workspace: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId | null;
  task?: mongoose.Types.ObjectId | null;
  author: mongoose.Types.ObjectId;
  kind: CollaborationKind;
  message: string;
  progress?: number | null;
  blocker?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceCollaborationSchema =
  new Schema<WorkspaceCollaborationDocument>(
    {
      workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
      },
      project: {
        type: Schema.Types.ObjectId,
        ref: "Project",
        default: null,
      },
      task: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        default: null,
      },
      author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      kind: {
        type: String,
        enum: ["UPDATE", "CHAT"],
        required: true,
      },
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      blocker: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },
    },
    { timestamps: true }
  );

const WorkspaceCollaborationModel = mongoose.model<WorkspaceCollaborationDocument>(
  "WorkspaceCollaboration",
  workspaceCollaborationSchema
);

export default WorkspaceCollaborationModel;
