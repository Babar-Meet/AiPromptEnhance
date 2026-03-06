import { Router } from "express";
import { requireRole } from "../middleware/role.js";
import {
  addModel,
  adminListModels,
  deleteModel,
  updateModel,
} from "../controllers/modelController.js";
import {
  listUsers,
  updateUserRole,
} from "../controllers/adminUserController.js";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import {
  listPaymentRequests,
  updatePaymentStatus,
} from "../controllers/subscriptionController.js";

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));

adminRouter.get("/models", adminListModels);
adminRouter.post("/models", addModel);
adminRouter.patch("/models/:id", updateModel);
adminRouter.delete("/models/:id", deleteModel);

adminRouter.get("/users", listUsers);
adminRouter.patch("/users/:id", updateUserRole);

adminRouter.get("/settings", getSettings);
adminRouter.patch("/settings", updateSettings);

adminRouter.get("/payments", listPaymentRequests);
adminRouter.patch("/payments/:id", updatePaymentStatus);
