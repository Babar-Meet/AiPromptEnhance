import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
  },
  { _id: false },
);

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    mode: {
      type: String,
      enum: ["grammar", "enhancer", "master"],
      required: true,
    },
    model: { type: String, required: true },
    messages: { type: [messageSchema], default: [] },
    expiresAt: {
      type: Date,
      index: {
        expireAfterSeconds: 0,
        partialFilterExpression: { expiresAt: { $exists: true } },
      },
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: true } },
);

export const Chat = mongoose.model("Chat", chatSchema, "chats");
