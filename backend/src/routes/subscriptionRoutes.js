import { Router } from "express";
import { createPaymentRequest } from "../controllers/subscriptionController.js";

export const subscriptionRouter = Router();

subscriptionRouter.post("/request", createPaymentRequest);
