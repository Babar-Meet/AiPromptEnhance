import { Router } from "express";
import {
  deleteChat,
  getChat,
  listChats,
  streamChat,
} from "../controllers/chatController.js";
import { roleAwareLimiter } from "../middleware/rateLimit.js";

export const chatRouter = Router();

chatRouter.get("/", listChats);
chatRouter.get("/:id", getChat);
chatRouter.delete("/:id", deleteChat);
chatRouter.post("/message", roleAwareLimiter, streamChat);
