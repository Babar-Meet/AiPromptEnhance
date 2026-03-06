import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export function ChatSidebar({
  chats,
  activeChatId,
  onSelect,
  onDelete,
  onNewChat,
  sidebarOpen,
  onToggleSidebar,
}) {
  const auth = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col bg-[#202123] transition-transform duration-200 md:relative md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* New Chat button */}
        <div className="flex items-center gap-2 border-b border-white/10 p-2">
          <button
            onClick={onNewChat}
            className="flex flex-1 items-center gap-3 rounded-md border border-white/20 px-3 py-3 text-sm text-white transition hover:bg-white/10"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            New chat
          </button>
          <button
            onClick={onToggleSidebar}
            className="rounded-md p-3 text-white/60 hover:bg-white/10 md:hidden"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>

        {/* Chat list */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={`group relative flex items-center rounded-md text-sm transition ${
                  chat._id === activeChatId
                    ? "bg-[#343541] text-white"
                    : "text-white/70 hover:bg-[#2a2b32]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(chat._id)}
                  className="flex flex-1 items-center gap-3 overflow-hidden px-3 py-3 text-left"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="shrink-0 opacity-60"
                  >
                    <path d="M2 4h12M2 8h12M2 12h8" />
                  </svg>
                  <span className="flex-1 truncate">{chat.title}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chat._id);
                  }}
                  className="mr-2 hidden rounded p-1 text-white/40 hover:text-red-400 group-hover:block"
                  title="Delete chat"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 4h8M5 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M6 7v3M8 7v3M4 4l.5 7a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L10 4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          {chats.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-white/30">
              No conversations yet
            </p>
          )}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-white/10 p-2">
          {auth.isAuthenticated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10a37f] text-xs font-bold text-white">
                  {auth.user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/90">
                    {auth.user?.email}
                  </p>
                  <p className="text-xs capitalize text-white/40">
                    {auth.role}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 px-1">
                {auth.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex-1 rounded-md px-2 py-1.5 text-center text-xs text-white/50 hover:bg-white/10 hover:text-white/80"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/shortcuts"
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs text-white/50 hover:bg-white/10 hover:text-white/80"
                >
                  Shortcuts
                </Link>
                <Link
                  to="/subscription"
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs text-white/50 hover:bg-white/10 hover:text-white/80"
                >
                  Upgrade
                </Link>
                <button
                  onClick={auth.logout}
                  className="flex-1 rounded-md px-2 py-1.5 text-xs text-white/50 hover:bg-white/10 hover:text-white/80"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1 px-1">
              <Link
                to="/shortcuts"
                className="flex-1 rounded-md border border-white/20 px-3 py-2 text-center text-sm text-white/80 hover:bg-white/10"
              >
                Shortcuts
              </Link>
              <Link
                to="/login"
                className="flex-1 rounded-md bg-[#10a37f] px-3 py-2 text-center text-sm font-medium text-white hover:bg-[#0d8c6d]"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-md border border-white/20 px-3 py-2 text-center text-sm text-white/80 hover:bg-white/10"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
