import Badge from "./Badge";

const tones = {
  blue: "from-blue-500/20 to-cyan-500/10",
  violet: "from-violet-500/20 to-fuchsia-500/10",
  emerald: "from-emerald-500/20 to-teal-500/10",
  amber: "from-amber-500/20 to-orange-500/10",
  rose: "from-rose-500/20 to-pink-500/10",
};

export default function StatCard({ label, value, detail, tone = "blue" }) {
  return (
    <div className={`glass-panel surface-hover grid-sheen rounded-3xl bg-gradient-to-br ${tones[tone]} p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 wrap-anywhere text-sm text-slate-300">{label}</p>
        <Badge tone={tone}>Live mock</Badge>
      </div>
      <p className="mt-3 wrap-anywhere text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 wrap-anywhere text-sm text-slate-400">{detail}</p>
    </div>
  );
}
