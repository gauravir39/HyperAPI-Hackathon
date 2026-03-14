import { Bot, Boxes, FileJson2, Files, Moon, SearchCheck, SunMedium, UploadCloud } from "lucide-react";

const iconMap = {
  hero: Bot,
  upload: UploadCloud,
  vendors: Boxes,
  documents: Files,
  findings: SearchCheck,
  export: FileJson2,
};

export default function SidebarNav({ items, activeSection, theme, onToggleTheme }) {
  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] w-full max-w-[17.25rem] shrink-0 lg:block">
      <div className="glass-panel flex h-full min-h-0 flex-col rounded-[28px] p-4 xl:p-5">
        <div>
          <div className="inline-flex rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 p-3 shadow-soft">
            <Bot className="h-6 w-6 text-slate-950" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">FinNeedle AI</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400 wrap-anywhere">
            Audit-grade anomaly detection for large financial PDF datasets.
          </p>
        </div>

        <nav className="mt-7 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {items.map((item) => {
            const Icon = iconMap[item.id] ?? Bot;
            const active = activeSection === item.id;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`flex min-w-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-white/10 text-white shadow-glow"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="min-w-0 wrap-anywhere">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="mt-4 space-y-3">
          <button
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="control-button control-button-secondary w-full"
          >
            {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <div className="glass-panel rounded-3xl p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Submission Status</p>
            <p className="mt-3 text-lg font-semibold text-white">Ready for demo</p>
            <p className="mt-2 text-sm leading-6 text-slate-400 wrap-anywhere">
              Mock pipeline loaded, findings seeded, and export payload prepared.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
