import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

export const app = express();

function normalizeOrigin(value) {
  return (value || "").trim().replace(/\/$/, "");
}

function buildAllowedOrigins() {
  const configured = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

  return new Set(configured);
}

function buildWildcardOriginRegexes() {
  const configured = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter((item) => item.includes("*"));

  return configured
    .map((item) => {
      const escaped = item
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`, "i");
    })
    .filter(Boolean);
}

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function isAllowedOrigin(origin, allowedOrigins, wildcardOriginRegexes) {
  const normalized = normalizeOrigin(origin);

  if (!normalized || isLocalDevOrigin(normalized) || allowedOrigins.has(normalized)) {
    return true;
  }

  return wildcardOriginRegexes.some((regex) => regex.test(normalized));
}

const allowedOrigins = buildAllowedOrigins();
const wildcardOriginRegexes = buildWildcardOriginRegexes();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and local dev hosts.
      if (isAllowedOrigin(origin, allowedOrigins, wildcardOriginRegexes)) {
        return callback(null, true);
      }
      const error = new Error("Not allowed by CORS");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
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
