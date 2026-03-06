import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/useAuth";
import { ModeSelector } from "../components/ModeSelector";
import { ChatSidebar } from "../components/ChatSidebar";
import { MessageList } from "../components/MessageList";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000/api")
  .trim()
  .replace(/\/$/, "");
const MODE_IDS = ["grammar", "enhancer", "master"];
const IS_MAC =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform);

function hasPrimaryModifier(event) {
  return IS_MAC
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function isModSlashShortcut(event) {
  return event.code === "Slash" || event.key === "/" || event.key === "?";
}

async function streamChatMessage({
  token,
  payload,
  signal,
  onMeta,
  onToken,
  onReplace,
  onDone,
}) {
  const response = await fetch(`${API_BASE}/chat/message`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Streaming failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    const chunks = buf.split("\n\n");
    buf = chunks.pop() || "";

    for (const chunk of chunks) {
      const eventLine = chunk
        .split("\n")
        .find((line) => line.startsWith("event:"));
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) continue;

      const event = eventLine.replace("event:", "").trim();
      const data = JSON.parse(dataLine.replace("data:", "").trim());
      if (event === "meta") onMeta(data);
      if (event === "token") onToken(data.token || "");
      if (event === "replace") onReplace(data.content || "");
      if (event === "done") onDone();
      if (event === "error") throw new Error(data.message || "Stream error");
    }
  }
}

export function ChatPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [mode, setMode] = useState("enhancer");
  const [models, setModels] = useState([]);
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [chatId, setChatId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [compareModels, _setCompareModels] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const viewRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  const isPaid = auth.role === "paid" || auth.role === "admin";

  useEffect(() => {
    async function load() {
      const [{ data: modelData }, chatsResponse] = await Promise.all([
        api.get("/models"),
        auth.isAuthenticated
          ? api.get("/chats")
          : Promise.resolve({ data: [] }),
      ]);
      setModels(modelData);
      setModel((prev) => prev || modelData[0]?.modelId || "");
      setChats(chatsResponse.data || []);
    }
    load().catch((err) =>
      setError(err?.response?.data?.message || err.message),
    );
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.scrollTop = viewRef.current.scrollHeight;
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [prompt]);

  const canChooseModel = auth.role !== "guest";

  function focusComposer() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }

  function newChat() {
    setChatId("");
    setMessages([]);
    setPrompt("");
    setAnalyzeResult(null);
    setError("");
  }

  async function sendPrompt(event) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;

    const userMessage = { role: "user", content: prompt };
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" },
    ]);
    setBusy(true);
    setError("");

    try {
      const abortController = new AbortController();
      abortRef.current = abortController;

      let streamingText = "";
      await streamChatMessage({
        token: auth.token,
        signal: abortController.signal,
        payload: {
          mode,
          model,
          prompt,
          chatId,
          playground: isPaid
            ? {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 2048,
                system_prompt: "",
              }
            : {},
        },
        onMeta(meta) {
          if (meta.chatId) setChatId(meta.chatId);
          if (meta.model) setModel(meta.model);
        },
        onToken(token) {
          streamingText += token;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: streamingText,
            };
            return next;
          });
        },
        onReplace(content) {
          streamingText = content;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content,
            };
            return next;
          });
        },
        onDone() {},
      });

      setPrompt("");
      if (auth.isAuthenticated) {
        const { data } = await api.get("/chats");
        setChats(data);
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError(err?.message || "Request failed");
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function stopGenerating() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }

  const openChat = useCallback(
    async (id) => {
      const { data } = await api.get(`/chats/${id}`);
      setChatId(data._id);
      setMessages(data.messages || []);
      setMode(data.mode || "enhancer");
      setModel(data.model || model);
      setSidebarOpen(false);
    },
    [model],
  );

  async function removeChat(id) {
    await api.delete(`/chats/${id}`);
    setChats((prev) => prev.filter((c) => c._id !== id));
    if (chatId === id) {
      setChatId("");
      setMessages([]);
    }
  }

  async function analyzePrompt() {
    const { data } = await api.post("/tools/analyze", { prompt });
    setAnalyzeResult(data);
  }

  async function compare() {
    const selected = compareModels.length ? compareModels : [model];
    const { data } = await api.post("/tools/compare", {
      prompt,
      mode,
      models: selected,
    });
    const blocks = data.responses.map((item) => ({
      role: "assistant",
      content: `[${item.model}]\n${item.response}`,
    }));
    setMessages((prev) => [...prev, ...blocks]);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!busy) sendPrompt(e);
    }
  }

  useEffect(() => {
    async function browseChat(direction) {
      if (!chats.length) return;

      const currentIndex = chats.findIndex((c) => c._id === chatId);
      const nextIndex =
        currentIndex === -1
          ? direction > 0
            ? 0
            : chats.length - 1
          : (currentIndex + direction + chats.length) % chats.length;

      const target = chats[nextIndex];
      if (!target) return;

      try {
        await openChat(target._id);
      } catch (err) {
        setError(
          err?.response?.data?.message || err?.message || "Failed to open chat",
        );
      }
    }

    function onGlobalShortcut(event) {
      if (event.defaultPrevented || event.isComposing) return;

      const key = event.key.toLowerCase();
      const isAltOnlyShortcut =
        !event.shiftKey && !event.ctrlKey && !event.metaKey && event.altKey;

      if (isAltOnlyShortcut) {
        if (key === "b") {
          event.preventDefault();
          setSidebarOpen((prev) => !prev);
          return;
        }

        if (key === "n") {
          event.preventDefault();
          newChat();
          focusComposer();
          return;
        }

        if (key === "arrowup") {
          event.preventDefault();
          browseChat(-1);
          return;
        }

        if (key === "arrowdown") {
          event.preventDefault();
          browseChat(1);
          return;
        }

        if (key === "1" || key === "2" || key === "3") {
          event.preventDefault();
          const index = Number(key) - 1;
          const targetMode = MODE_IDS[index];
          if (targetMode) setMode(targetMode);
          return;
        }
      }

      if (isEditableTarget(event.target)) return;

      if (!hasPrimaryModifier(event) || event.altKey || event.shiftKey) return;

      if (key === "k") {
        event.preventDefault();
        focusComposer();
        return;
      }

      if (isModSlashShortcut(event)) {
        event.preventDefault();
        navigate("/shortcuts");
      }
    }

    window.addEventListener("keydown", onGlobalShortcut);
    return () => window.removeEventListener("keydown", onGlobalShortcut);
  }, [chats, chatId, navigate, openChat]);

  const currentModel = models.find((m) => m.modelId === model);

  return (
    <div className="flex h-screen w-full bg-[#343541]">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        activeChatId={chatId}
        onSelect={openChat}
        onDelete={removeChat}
        onNewChat={newChat}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-white/10 bg-[#343541] px-4 py-2">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-md p-2 text-white/60 hover:bg-white/10"
              title="Toggle sidebar (Alt+B)"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 5h12M3 9h12M3 13h12" />
              </svg>
            </button>

            {/* Model selector */}
            <div className="relative">
              <button
                onClick={() =>
                  canChooseModel && setShowModelMenu(!showModelMenu)
                }
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                {currentModel?.name || model || "Select model"}
                {canChooseModel && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 5l3 3 3-3" />
                  </svg>
                )}
              </button>
              {showModelMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowModelMenu(false)}
                  />
                  <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-white/10 bg-[#202123] py-1 shadow-lg">
                    {models.map((item) => (
                      <button
                        key={item.modelId}
                        onClick={() => {
                          setModel(item.modelId);
                          setShowModelMenu(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                          item.modelId === model
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-xs text-white/30">
                          {item.provider}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModeSelector mode={mode} onChange={setMode} />
            <button
              type="button"
              onClick={focusComposer}
              className="rounded-md px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white/90"
              title="Focus chat input (Ctrl/Cmd+K)"
            >
              Focus
            </button>
            <Link
              to="/shortcuts"
              className="rounded-md px-2 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white/90"
              title="Keyboard shortcuts (Ctrl/Cmd+/)"
            >
              Shortcuts
            </Link>
          </div>
        </header>

        {/* Messages area */}
        <div ref={viewRef} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome / empty state */
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-white/50"
                >
                  <path d="M16 2l4 6h6l-2 6 4 6h-6l-4 6-4-6H8l2-6-4-6h6z" />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-semibold text-white/90">
                Dr. Ai Prompt Enhance
              </h1>
              <p className="max-w-md text-center text-sm leading-6 text-white/40">
                Prompt Enhancement + Multi-Model AI Platform. Type a message
                below to get started.
              </p>
              {!auth.isAuthenticated && (
                <p className="mt-3 text-xs text-white/30">
                  Guest mode — chat history is not stored. Prompt limit: 500
                  chars.
                </p>
              )}
            </div>
          ) : (
            <MessageList
              messages={messages}
              loading={busy && messages[messages.length - 1]?.content === ""}
            />
          )}
        </div>

        {/* Analyze result */}
        {analyzeResult && (
          <div className="border-t border-white/10 bg-[#2a2b32] px-4 py-3">
            <div className="mx-auto max-w-3xl text-sm text-emerald-300">
              <p className="font-bold">
                Prompt Score: {analyzeResult.promptScore} / 10
              </p>
              <p className="mt-1 text-emerald-300/70">
                Strengths: {analyzeResult.strengths.join(", ") || "—"}
              </p>
              <p className="text-emerald-300/70">
                Weaknesses: {analyzeResult.weaknesses.join(", ") || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="border-t border-red-900/30 bg-red-950/30 px-4 py-2">
            <p className="mx-auto max-w-3xl text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Bottom input area */}
        <div className="border-t border-white/10 bg-[#343541] px-4 pb-4 pt-3">
          <form onSubmit={sendPrompt} className="mx-auto max-w-3xl">
            <div className="relative flex items-end rounded-xl border border-white/15 bg-[#40414f] shadow-lg">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Message Dr. Ai Prompt Enhance..."
                className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-4 py-3 text-sm text-white/90 placeholder-white/30 focus:outline-none"
              />
              <div className="flex items-center gap-1 pr-2 pb-2">
                {auth.isAuthenticated && (
                  <button
                    type="button"
                    onClick={analyzePrompt}
                    disabled={!prompt.trim() || busy}
                    className="rounded-md p-2 text-white/30 transition hover:bg-white/10 hover:text-white/60 disabled:opacity-30"
                    title="Analyze prompt"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3l2 2" />
                    </svg>
                  </button>
                )}
                {isPaid && (
                  <button
                    type="button"
                    onClick={compare}
                    disabled={!prompt.trim() || busy}
                    className="rounded-md p-2 text-white/30 transition hover:bg-white/10 hover:text-white/60 disabled:opacity-30"
                    title="Multi-model compare"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="2" y="2" width="5" height="5" rx="1" />
                      <rect x="9" y="9" width="5" height="5" rx="1" />
                      <path d="M7 4.5h2M4.5 7v2" />
                    </svg>
                  </button>
                )}
                {busy ? (
                  <button
                    type="button"
                    onClick={stopGenerating}
                    className="flex items-center gap-1 rounded-md bg-red-500/70 px-2 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                    title="Stop generating"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <rect x="4" y="4" width="8" height="8" rx="1" />
                    </svg>
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="rounded-md bg-white/10 p-2 text-white transition hover:bg-[#10a37f] disabled:opacity-30 disabled:hover:bg-white/10"
                    title="Send message"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 12V4M4 7l4-4 4 4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-white/20">
              Dr. Ai Prompt Enhance can make mistakes. Consider checking
              information.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
