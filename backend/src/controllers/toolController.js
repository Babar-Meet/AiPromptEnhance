import { getModelForRequest } from "../services/access.js";
import { getSetting } from "../services/settings.js";
import {
  applyModeTemplate,
  enforcePromptOnlyOutput,
} from "../services/promptModes.js";
import { DEFAULT_SETTINGS } from "../utils/constants.js";
import { streamModelResponse } from "../services/aiRouter.js";

function quickScore(prompt) {
  let score = 4.5;
  const strengths = [];
  const weaknesses = [];

  if (prompt.length > 60) {
    score += 1.2;
    strengths.push("Has enough detail");
  } else {
    weaknesses.push("Could include more context");
  }

  if (/output|format|json|table/i.test(prompt)) {
    score += 1.6;
    strengths.push("Defines expected output");
  } else {
    weaknesses.push("Missing output format");
  }

  if (/must|only|do not|constraint/i.test(prompt)) {
    score += 1.3;
    strengths.push("Contains constraints");
  } else {
    weaknesses.push("Missing explicit constraints");
  }

  if (/step|first|then|finally/i.test(prompt)) {
    score += 1.1;
    strengths.push("Includes structure/instructions");
  }

  return {
    score: Math.min(10, Number(score.toFixed(1))),
    strengths,
    weaknesses,
  };
}

export async function compareModels(req, res, next) {
  try {
    const role = req.auth.role;
    if (role === "guest")
      return res.status(403).json({ message: "Guest cannot use comparison" });

    const modelIds = Array.isArray(req.body.models) ? req.body.models : [];
    const prompt = String(req.body.prompt || "");
    const mode = String(req.body.mode || "enhancer");
    const limit =
      role === "free"
        ? 1
        : await getSetting("comparisonLimit", DEFAULT_SETTINGS.comparisonLimit);

    if (modelIds.length === 0 || modelIds.length > limit) {
      return res
        .status(400)
        .json({ message: `Comparison requires 1-${limit} models` });
    }

    const modePrompt = applyModeTemplate(mode, prompt);

    const responses = [];
    for (const id of modelIds) {
      const model = await getModelForRequest(role, id);
      let text = "";
      for await (const token of streamModelResponse(model, [
        { role: "user", content: modePrompt },
      ])) {
        text += token;
      }
      responses.push({
        model: id,
        response: enforcePromptOnlyOutput({
          mode,
          userInput: prompt,
          rawOutput: text,
        }),
      });
    }

    res.json({ responses });
  } catch (error) {
    next(error);
  }
}

export async function analyzePrompt(req, res, next) {
  try {
    const role = req.auth.role;
    if (role === "guest")
      return res.status(403).json({ message: "Guest cannot use analyzer" });
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) return res.status(400).json({ message: "Prompt is required" });

    const result = quickScore(prompt);
    res.json({
      promptScore: result.score,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      scoringModel: await getSetting(
        "promptScoringModel",
        DEFAULT_SETTINGS.promptScoringModel,
      ),
    });
  } catch (error) {
    next(error);
  }
}
