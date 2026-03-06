import mongoose from "mongoose";

const modelConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    modelId: { type: String, required: true, unique: true },
    provider: {
      type: String,
      enum: ["ollama", "openai", "anthropic", "groq", "openrouter", "custom"],
      required: true,
    },
    apiKey: { type: String, default: "" },
    customBaseUrl: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    allowGuest: { type: Boolean, default: false },
    allowFree: { type: Boolean, default: false },
    allowPaid: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: true } },
);

export const ModelConfig = mongoose.model(
  "ModelConfig",
  modelConfigSchema,
  "models",
);
