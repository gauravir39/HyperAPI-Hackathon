import Badge from "./Badge";

const riskTone = {
  Low: "emerald",
  Medium: "amber",
  High: "rose",
  Valid: "emerald",
  Mismatch: "amber",
  Suspicious: "rose",
  Processed: "emerald",
  Flagged: "rose",
  Open: "amber",
  Review: "blue",
  Escalated: "rose",
  Resolved: "emerald",
};

export default function DataTable({ columns, rows, compact = false }) {
  return (
    <div className="glass-panel min-w-0 overflow-hidden rounded-3xl">
      <div className="scroll-panel max-w-full overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed divide-y divide-white/10">
          {columns.some((column) => column.width) ? (
            <colgroup>
              {columns.map((column) => (
                <col key={column.key} style={column.width ? { width: column.width } : undefined} />
              ))}
            </colgroup>
          ) : null}
          <thead className="bg-white/[0.03]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 ${column.headerClassName ?? ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex} className="hover:bg-white/[0.03]">
                {columns.map((column) => {
                  const value = row[column.key];
                  const isStatus =
                    column.key === "risk" || column.key === "status" || column.key === "validationStatus";

                  return (
                    <td
                      key={column.key}
                      className={`px-4 align-middle text-sm leading-6 text-slate-200 ${compact ? "py-3" : "py-3.5"} ${
                        column.cellClassName ?? "break-words"
                      }`}
                    >
                      {isStatus ? <Badge tone={riskTone[value] ?? "slate"}>{value}</Badge> : value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
