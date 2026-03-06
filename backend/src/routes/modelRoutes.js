import { Router } from "express";
import { listModels } from "../controllers/modelController.js";

export const modelRouter = Router();

modelRouter.get("/", listModels);
