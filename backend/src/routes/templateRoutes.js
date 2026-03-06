import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "../controllers/templateController.js";

export const templateRouter = Router();

templateRouter.get("/", listTemplates);
templateRouter.post("/", createTemplate);
templateRouter.patch("/:id", updateTemplate);
templateRouter.delete("/:id", deleteTemplate);
