import { Router } from "express";
import { authRouter } from "./authRoutes.js";
import { modelRouter } from "./modelRoutes.js";
import { adminRouter } from "./adminRoutes.js";
import { chatRouter } from "./chatRoutes.js";
import { templateRouter } from "./templateRoutes.js";
import { toolRouter } from "./toolRoutes.js";
import { subscriptionRouter } from "./subscriptionRoutes.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export const apiRouter = Router();

apiRouter.use(optionalAuth);

apiRouter.use("/auth", authRouter);
apiRouter.use("/models", modelRouter);

apiRouter.use("/chat", chatRouter);
apiRouter.use("/chats", chatRouter);

apiRouter.use("/subscription", requireAuth, subscriptionRouter);
apiRouter.use("/templates", requireAuth, templateRouter);
apiRouter.use("/tools", requireAuth, toolRouter);
apiRouter.use("/admin", requireAuth, adminRouter);
