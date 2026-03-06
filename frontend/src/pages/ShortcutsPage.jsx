const shortcuts = [
  {
    keys: "Ctrl/Cmd + K",
    action: "Focus chat input",
    details: "Moves cursor to the message box so you can type immediately.",
  },
  {
    keys: "Ctrl/Cmd + B",
    action: "Toggle sidebar",
    details: "Open or close chat history sidebar from anywhere.",
  },
  {
    keys: "Ctrl/Cmd + Shift + 1",
    action: "Switch to Grammar mode",
    details: "Selects Grammar mode instantly.",
  },
  {
    keys: "Ctrl/Cmd + Shift + 2",
    action: "Switch to Enhance mode",
    details: "Selects Enhance mode instantly.",
  },
  {
    keys: "Ctrl/Cmd + Shift + 3",
    action: "Switch to Master mode",
    details: "Selects Master mode instantly.",
  },
  {
    keys: "Ctrl/Cmd + Shift + Arrow Up",
    action: "Open previous chat",
    details: "Moves to the previous conversation in your chat list.",
  },
  {
    keys: "Ctrl/Cmd + Shift + Arrow Down",
    action: "Open next chat",
    details: "Moves to the next conversation in your chat list.",
  },
  {
    keys: "Ctrl/Cmd + Shift + N",
    action: "Start a new chat",
    details: "Creates a fresh chat and focuses the input automatically.",
  },
  {
    keys: "Ctrl/Cmd + /",
    action: "Open shortcuts page",
    details: "Quick way to open this help page.",
  },
];

export function ShortcutsPage() {
  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-950/70 p-8">
      <h1 className="text-2xl font-bold text-slate-100">Keyboard Shortcuts</h1>
      <p className="mt-2 text-sm text-slate-300">
        This page is read-only. Use these shortcuts to work faster in chat
        without using the mouse.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/70 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-semibold">Shortcut</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((item) => (
              <tr
                key={item.keys}
                className="border-t border-slate-800 text-slate-200/90"
              >
                <td className="px-4 py-3 align-top">
                  <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-cyan-300">
                    {item.keys}
                  </kbd>
                </td>
                <td className="px-4 py-3 align-top">{item.action}</td>
                <td className="px-4 py-3 align-top text-slate-400">
                  {item.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
