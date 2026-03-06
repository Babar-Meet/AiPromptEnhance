import { MODES } from "../utils/constants.js";

export function applyModeTemplate(mode, userInput) {
  const template = MODES[mode];
  if (!template) {
    const error = new Error("Invalid prompt mode");
    error.status = 400;
    throw error;
  }
  return template.replace("{user_input}", userInput);
}

function collapseWhitespace(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function looksLikeFinalTaskAnswer(text) {
  if (!text) return true;

  const normalized = text.toLowerCase();
  const codeSignals = [
    /```/,
    /#include\s*</,
    /\bint\s+main\s*\(/,
    /\bpublic\s+static\s+void\s+main\s*\(/,
    /\bdef\s+\w+\s*\(/,
    /\bfunction\s+\w+\s*\(/,
    /\bclass\s+\w+/,
  ];
  if (codeSignals.some((rule) => rule.test(text))) return true;

  const answerSignals = [
    "here is the program",
    "here's the program",
    "here is the code",
    "here's the code",
    "the answer is",
    "solution:",
  ];
  return answerSignals.some((signal) => normalized.includes(signal));
}

function looksLikeClarificationQuestion(text) {
  const normalized = String(text || "").toLowerCase();
  const clarificationSignals = [
    "please provide more details",
    "could you provide more details",
    "can you provide more details",
    "please share more details",
    "i need more information",
    "i need more details",
    "what are your requirements",
    "what is your business",
  ];

  const endsWithQuestion = normalized.trim().endsWith("?");
  return (
    clarificationSignals.some((signal) => normalized.includes(signal)) ||
    (endsWithQuestion && /details|requirements|information/.test(normalized))
  );
}

export function buildSafePromptFallback(mode, userInput) {
  const base = collapseWhitespace(userInput);
  if (mode === "grammar") {
    return `Refine the following prompt by correcting grammar, spelling, and sentence structure while preserving the original goal. Return only the improved prompt text, with no explanation and no solution.\n\nPrompt:\n${base}`;
  }

  if (mode === "master") {
    return `You are a senior prompt engineer. Convert the user request below into a professional master prompt for another AI model.\n\nUser request:\n${base}\n\nRequired sections:\n- Role\n- Objective\n- Context\n- Constraints\n- Output format\n- Step-by-step instructions\n\nRules:\n- Do not answer the request\n- Do not include runnable code\n- Return only the generated master prompt text`;
  }

  return `Rewrite the following user request into a clear, advanced, and well-structured AI prompt. Do not answer the request itself. Return only the improved prompt.\n\nUser request:\n${base}`;
}

export function enforcePromptOnlyOutput({ mode, userInput, rawOutput }) {
  const cleaned = collapseWhitespace(rawOutput);
  if (
    !cleaned ||
    looksLikeFinalTaskAnswer(cleaned) ||
    looksLikeClarificationQuestion(cleaned)
  ) {
    return buildSafePromptFallback(mode, userInput);
  }
  return cleaned;
}
