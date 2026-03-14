const toneStyles = {
  blue: "bg-blue-500/15 text-blue-200 ring-blue-400/30",
  violet: "bg-violet-500/15 text-violet-200 ring-violet-400/30",
  emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  amber: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  rose: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
  slate: "bg-slate-500/15 text-slate-200 ring-slate-400/30",
};

export default function Badge({ children, tone = "slate" }) {
  return (
    <span
      className={`inline-flex max-w-full items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium leading-5 whitespace-normal break-words ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}
