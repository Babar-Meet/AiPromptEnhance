import mongoose from "mongoose";

const promptTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    template: { type: String, required: true },
    variables: { type: [String], default: [] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: true } },
);

export const PromptTemplate = mongoose.model(
  "PromptTemplate",
  promptTemplateSchema,
  "prompt_templates",
);
