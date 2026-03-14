import Badge from "./Badge";

const difficultyTone = {
  Easy: "emerald",
  Medium: "amber",
  Evil: "rose",
};

const severityTone = {
  Low: "emerald",
  Medium: "amber",
  High: "rose",
  Critical: "rose",
};

export default function FindingsTable({ rows, onRowClick }) {
  return (
    <div className="glass-panel min-w-0 overflow-hidden rounded-3xl">
      <div className="scroll-panel max-w-full overflow-x-auto">
        <table className="w-full min-w-[1060px] table-fixed divide-y divide-white/10">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead className="bg-white/[0.03]">
            <tr>
              {[
                "finding_id",
                "category",
                "pages",
                "document_refs",
                "reported_value",
                "correct_value",
                "confidence",
                "severity",
              ].map((column) => (
                <th
                  key={column}
                  className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  {column.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((item) => (
              <tr
                key={item.finding_id}
                className="cursor-pointer hover:bg-white/[0.03]"
                onClick={() => onRowClick?.(item)}
              >
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-sm font-medium text-white">{item.finding_id}</td>
                <td className="px-4 py-3.5 align-top text-sm text-slate-200">
                  <div className="flex min-w-0 flex-col gap-2">
                    <Badge tone={difficultyTone[item.difficulty]}>{item.difficulty}</Badge>
                    <Badge tone="blue">{item.category}</Badge>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-sm text-slate-200">{item.pages}</td>
                <td className="px-4 py-3.5 align-top text-sm leading-6 text-slate-300 break-words">{item.document_refs}</td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-sm text-rose-200">{item.reported_value}</td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-sm text-emerald-200">{item.correct_value}</td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-sm text-slate-200">{Math.round(item.confidence * 100)}%</td>
                <td className="whitespace-nowrap px-4 py-3.5 align-top text-sm">
                  <Badge tone={severityTone[item.severity]}>{item.severity}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
