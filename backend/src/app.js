import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

export const app = express();

function buildAllowedOrigins() {
  const configured = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return new Set(configured);
}

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

const allowedOrigins = buildAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and local dev hosts.
      if (!origin || isLocalDevOrigin(origin) || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "dr-ai-prompt-enhance-backend" });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
