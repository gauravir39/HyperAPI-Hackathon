import { Menu, Moon, Sparkles, SunMedium } from "lucide-react";

export default function TopNav({ items, theme, onToggleTheme }) {
  return (
    <div className="glass-panel sticky top-4 z-30 mb-6 flex min-w-0 items-center justify-between gap-3 rounded-3xl px-4 py-3 lg:hidden">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">FinNeedle AI</p>
        <p className="truncate text-sm font-medium text-white">Audit command center</p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden min-w-0 gap-2 sm:flex">
          {items.slice(0, 3).map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="max-w-[120px] truncate rounded-full bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              {item.label}
            </a>
          ))}
        </div>
        <button
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="control-button control-button-secondary min-h-10 px-3 py-2"
        >
          {theme === "dark" ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="control-button control-button-secondary min-h-10 px-3 py-2">
          <Sparkles className="h-4 w-4" />
        </button>
        <button className="control-button control-button-secondary min-h-10 px-3 py-2">
          <Menu className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
