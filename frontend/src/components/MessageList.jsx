import { useState } from "react";

function stripPromptMarkers(text) {
  return String(text || "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();
}

function renderInlineBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function StyledPromptText({ text }) {
  const lines = String(text || "").split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const content = headingMatch[2];
          const sizeClass =
            level === 1
              ? "text-lg font-bold"
              : level === 2
                ? "text-base font-semibold"
                : "text-sm font-semibold";
          return (
            <p key={idx} className={`${sizeClass} text-white/95`}>
              {renderInlineBold(content)}
            </p>
          );
        }

        if (/^[-*]\s+/.test(trimmed)) {
          const content = trimmed.replace(/^[-*]\s+/, "");
          return (
            <p key={idx} className="pl-4 text-sm leading-7 text-white/90">
              <span className="mr-2 text-white/60">•</span>
              {renderInlineBold(content)}
            </p>
          );
        }

        return (
          <p key={idx} className="text-sm leading-7 text-white/90">
            {renderInlineBold(line)}
          </p>
        );
      })}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(stripPromptMarkers(text)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/40 transition hover:bg-white/10 hover:text-white/70"
      title="Copy response"
    >
      {copied ? (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7l3 3 5-6" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="4" y="4" width="7" height="7" rx="1" />
            <path d="M10 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

export function MessageList({ messages, loading }) {
  return (
    <div className="flex flex-col">
      {messages.map((m, i) => {
        const isUser = m.role === "user";
        return (
          <div
            key={`${m.role}-${i}`}
            className={`border-b border-white/5 ${isUser ? "bg-[#343541]" : "bg-[#444654]"}`}
          >
            <div className="mx-auto flex max-w-3xl gap-4 px-4 py-6 md:gap-6 md:px-6">
              {/* Avatar */}
              <div className="flex shrink-0">
                {isUser ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#5436da] text-xs font-bold text-white">
                    U
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#10a37f] text-xs text-white">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 1l2 3h3l-1 3 2 3h-3l-2 3-2-3H4l1-3-2-3h3z" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <StyledPromptText text={m.content} />
                {!isUser && (
                  <div className="mt-2 flex justify-start">
                    <CopyButton text={m.content} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {loading && (
        <div className="border-b border-white/5 bg-[#444654]">
          <div className="mx-auto flex max-w-3xl gap-4 px-4 py-6 md:gap-6 md:px-6">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-[#10a37f] text-xs text-white">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1l2 3h3l-1 3 2 3h-3l-2 3-2-3H4l1-3-2-3h3z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <span className="typing-cursor inline-block text-sm text-white/60">
                Thinking
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
