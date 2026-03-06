const modes = [
  { id: "grammar", label: "Grammar" },
  { id: "enhancer", label: "Enhance" },
  { id: "master", label: "Master" },
];

export function ModeSelector({ mode, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {modes.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
            mode === item.id
              ? "bg-white/15 text-white"
              : "text-white/40 hover:bg-white/10 hover:text-white/70"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
