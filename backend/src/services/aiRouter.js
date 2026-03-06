function decodeOllamaLine(line) {
  try {
    const obj = JSON.parse(line);
    if (obj.message?.content) return obj.message.content;
    return "";
  } catch {
    return "";
  }
}

async function* streamFromOllama(model, messages, options = {}) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
      options: {
        temperature: options.temperature,
        top_p: options.top_p,
      },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Ollama is unavailable or returned an error");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const chunk = decodeOllamaLine(line.trim());
      if (chunk) yield chunk;
    }
  }
}

async function* streamFromOpenAI(
  baseUrl,
  apiKey,
  model,
  messages,
  options = {},
) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options.temperature,
      top_p: options.top_p,
      max_tokens: options.max_tokens,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Provider returned an error");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n").filter((l) => l.startsWith("data:"));
      for (const line of lines) {
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const json = JSON.parse(data);
          const token = json.choices?.[0]?.delta?.content || "";
          if (token) yield token;
        } catch {
          // Ignore malformed event chunks.
        }
      }
    }
  }
}

async function* streamFromAnthropic(apiKey, model, messages, options = {}) {
  const system = messages.find((m) => m.role === "system")?.content || "";
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: options.max_tokens || 2048,
      temperature: options.temperature,
      top_p: options.top_p,
      stream: true,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Anthropic provider returned an error");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      const event = lines
        .find((line) => line.startsWith("event:"))
        ?.replace("event:", "")
        .trim();
      const dataLine = lines.find((line) => line.startsWith("data:"));
      if (!event || !dataLine) continue;

      try {
        const data = JSON.parse(dataLine.replace("data:", "").trim());
        if (event === "content_block_delta") {
          const token = data.delta?.text || "";
          if (token) yield token;
        }
      } catch {
        // Ignore malformed chunks.
      }
    }
  }
}

function providerBaseUrl(provider, customBaseUrl) {
  if (provider === "openai") return "https://api.openai.com/v1";
  if (provider === "groq") return "https://api.groq.com/openai/v1";
  if (provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (provider === "custom") return customBaseUrl;
  if (provider === "anthropic") return "https://api.anthropic.com/v1";
  return "";
}

export async function* streamModelResponse(
  modelConfig,
  messages,
  options = {},
) {
  if (modelConfig.provider === "ollama") {
    yield* streamFromOllama(modelConfig.modelId, messages, options);
    return;
  }

  const key = modelConfig.apiKey || "";
  const baseUrl = providerBaseUrl(
    modelConfig.provider,
    modelConfig.customBaseUrl || "",
  );
  if (!key || !baseUrl) {
    throw new Error(
      `Provider ${modelConfig.provider} is not configured with API key/base URL`,
    );
  }

  if (modelConfig.provider === "anthropic") {
    yield* streamFromAnthropic(key, modelConfig.modelId, messages, options);
    return;
  }

  yield* streamFromOpenAI(baseUrl, key, modelConfig.modelId, messages, options);
}
