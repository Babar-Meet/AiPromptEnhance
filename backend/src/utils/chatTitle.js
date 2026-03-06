export function buildChatTitle(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 50) || "New Chat";
}
