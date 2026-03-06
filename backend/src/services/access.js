import { ModelConfig } from "../models/ModelConfig.js";
import { getSetting } from "./settings.js";

export function modelAllowedForRole(model, role) {
  if (!model.enabled) return false;
  if (role === "admin") return true;
  if (role === "paid") return model.allowPaid;
  if (role === "free") return model.allowFree;
  return model.allowGuest;
}

export async function getModelForRequest(role, requestedModelId) {
  if (role === "guest") {
    const guestModelId = await getSetting("guestDefaultModelId", "gpt-oss:20b");
    const model = await ModelConfig.findOne({ modelId: guestModelId }).lean();
    if (!model || !modelAllowedForRole(model, role)) {
      const error = new Error("Guest model is not configured");
      error.status = 403;
      throw error;
    }
    return model;
  }

  const model = await ModelConfig.findOne({ modelId: requestedModelId }).lean();
  if (!model) {
    const error = new Error("Model not found");
    error.status = 404;
    throw error;
  }

  if (!modelAllowedForRole(model, role)) {
    const error = new Error("Model is not allowed for your role");
    error.status = 403;
    throw error;
  }

  return model;
}
