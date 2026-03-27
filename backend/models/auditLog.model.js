import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
