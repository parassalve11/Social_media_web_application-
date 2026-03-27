import AuditLog from "../models/auditLog.model.js";
import { logError } from "./logger.js";

export const audit = async ({
  action,
  userId,
  ip,
  userAgent,
  metadata = {},
}) => {
  try {
    await AuditLog.create({
      action,
      userId,
      ip,
      userAgent,
      metadata,
    });
  } catch (error) {
    logError("audit.log_failed", { action, error: error.message });
  }
};
