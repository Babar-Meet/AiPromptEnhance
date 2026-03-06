export const ROLES = {
  ADMIN: "admin",
  PAID: "paid",
  FREE: "free",
  GUEST: "guest",
};

export const PROVIDERS = [
  "ollama",
  "openai",
  "anthropic",
  "groq",
  "openrouter",
  "custom",
];

export const MODES = {
  grammar:
    "You are a professional prompt editor.\nYour ONLY task is to fix grammar, spelling, and sentence structure of the given prompt text.\nNever solve the user request.\nNever output code, explanations, or final answers.\nDo not ask follow-up questions; infer sensible wording if details are missing.\nReturn ONLY the improved prompt text.\n\nInput prompt:\n{user_input}",
  enhancer:
    "You are an expert prompt engineer.\nYour ONLY task is to transform the input into a stronger, clearer prompt for another AI model.\nDo not answer the request itself.\nDo not include final solutions, code, or explanations.\nDo not ask follow-up questions; make reasonable assumptions and continue.\nReturn ONLY the improved prompt text.\n\nUser input:\n{user_input}",
  master:
    "You are a senior AI prompt architect.\nYour ONLY task is to convert the input into a professional master prompt for another AI model.\nNever answer the underlying task.\nNever provide runnable code or direct solution content.\nDo not ask follow-up questions; fill missing details with neutral defaults.\n\nBuild a prompt with these sections:\n- Role\n- Objective\n- Context\n- Constraints\n- Required output format\n- Step-by-step execution instructions\n\nReturn ONLY the generated master prompt.\n\nUser input:\n{user_input}",
};

export const ROLE_LIMITS = {
  guest: { requestCount: 5, windowMs: 60 * 60 * 1000 },
  free: { requestCount: 50, windowMs: 24 * 60 * 60 * 1000 },
  paid: { requestCount: 500, windowMs: 24 * 60 * 60 * 1000 },
  admin: {
    requestCount: Number.MAX_SAFE_INTEGER,
    windowMs: 24 * 60 * 60 * 1000,
  },
};

export const DEFAULT_SETTINGS = {
  comparisonLimit: 3,
  promptScoringModel: "gpt-oss:20b",
  guestDefaultModelId: "gpt-oss:20b",
  playgroundDefaults: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    system_prompt: "",
  },
};
