import { Router } from "express";
import { analyzePrompt, compareModels } from "../controllers/toolController.js";

export const toolRouter = Router();

toolRouter.post("/compare", compareModels);
toolRouter.post("/analyze", analyzePrompt);
