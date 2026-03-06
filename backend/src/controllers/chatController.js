import { Chat } from "../models/Chat.js";
import {
  applyModeTemplate,
  enforcePromptOnlyOutput,
} from "../services/promptModes.js";
import { getModelForRequest } from "../services/access.js";
import { streamModelResponse } from "../services/aiRouter.js";
import { sanitizeText } from "../utils/sanitize.js";
import { buildChatTitle } from "../utils/chatTitle.js";

function writeSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function flushCompleteWordChunks(buffer, emit) {
  let start = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    if (/\s/.test(buffer[i])) {
      emit(buffer.slice(start, i + 1));
      start = i + 1;
    }
  }
  return buffer.slice(start);
}

async function enforceChatLimits(auth) {
  if (!auth.user) return;
  if (auth.role !== "free") return;

  const count = await Chat.countDocuments({ userId: auth.user._id });
  if (count < 10) return;

  const oldest = await Chat.findOne({ userId: auth.user._id }).sort({
    createdAt: 1,
  });
  if (oldest) await Chat.deleteOne({ _id: oldest._id });
}

export async function listChats(req, res, next) {
  try {
    if (!req.auth?.user) return res.json([]);
    const chats = await Chat.find(
      { userId: req.auth.user._id },
      { messages: 0 },
    )
      .sort({ createdAt: -1 })
      .lean();
    res.json(chats);
  } catch (error) {
    next(error);
  }
}

export async function getChat(req, res, next) {
  try {
    if (!req.auth?.user)
      return res.status(401).json({ message: "Authentication required" });
    const chat = await Chat.findOne({
      _id: req.params.id,
      userId: req.auth.user._id,
    }).lean();
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.json(chat);
  } catch (error) {
    next(error);
  }
}

export async function deleteChat(req, res, next) {
  try {
    if (!req.auth?.user)
      return res.status(401).json({ message: "Authentication required" });
    await Chat.deleteOne({ _id: req.params.id, userId: req.auth.user._id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function streamChat(req, res, next) {
  try {
    const role = req.auth?.role || "guest";
    const user = req.auth?.user || null;

    const mode = String(req.body.mode || "");
    const modelId = String(req.body.model || "");
    const prompt = sanitizeText(String(req.body.prompt || ""));
    const chatId = req.body.chatId || null;
    const playground = req.body.playground || {};

    if (!prompt) return res.status(400).json({ message: "Prompt is required" });
    if (role === "guest" && prompt.length > 500) {
      return res
        .status(400)
        .json({ message: "Guest prompt max length is 500" });
    }

    const model = await getModelForRequest(role, modelId);
    const modePrompt = applyModeTemplate(mode, prompt);

    let chat = null;
    if (user) {
      await enforceChatLimits(req.auth);
      if (chatId) {
        chat = await Chat.findOne({ _id: chatId, userId: user._id });
      }
      if (!chat) {
        const expiresAt =
          role === "free"
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : undefined;
        chat = await Chat.create({
          userId: user._id,
          title: buildChatTitle(prompt),
          mode,
          model: model.modelId,
          expiresAt,
          messages: [],
        });
      }
    }

    const history = chat?.messages || [];
    const inputMessages = [...history, { role: "user", content: modePrompt }];

    let clientClosed = false;
    req.on("close", () => {
      clientClosed = true;
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    writeSse(res, "meta", { chatId: chat?._id || null, model: model.modelId });

    let rawAnswer = "";
    let pendingWordBuffer = "";
    for await (const token of streamModelResponse(
      model,
      inputMessages,
      playground,
    )) {
      if (clientClosed) break;
      rawAnswer += token;
      pendingWordBuffer += token;
      pendingWordBuffer = flushCompleteWordChunks(
        pendingWordBuffer,
        (chunk) => {
          writeSse(res, "token", { token: chunk });
        },
      );
    }

    if (pendingWordBuffer && !clientClosed) {
      writeSse(res, "token", { token: pendingWordBuffer });
    }

    if (clientClosed) {
      return res.end();
    }

    const answer = enforcePromptOnlyOutput({
      mode,
      userInput: prompt,
      rawOutput: rawAnswer,
    });

    if (answer !== rawAnswer) {
      writeSse(res, "replace", { content: answer });
    }

    if (chat) {
      chat.messages.push({ role: "user", content: prompt });
      chat.messages.push({ role: "assistant", content: answer });
      await chat.save();
    }

    writeSse(res, "done", { ok: true });
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return next(error);
    }
    writeSse(res, "error", { message: error.message || "Streaming failed" });
    res.end();
  }
}
