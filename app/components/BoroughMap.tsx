interface Props {
  byBorough: Record<string, number>;
  textClass: string;
}

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

export function BoroughMap({ byBorough, textClass }: Props) {
  const max = Math.max(1, ...Object.values(byBorough));
  const total = Object.values(byBorough).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
      <p className="text-xs text-white/40 uppercase tracking-widest">By borough</p>
      <div className="space-y-2">
        {BOROUGHS.map((b) => {
          const count = byBorough[b] ?? 0;
          const pct = Math.round((count / max) * 100);
          return (
            <div key={b} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">{b}</span>
                <span className={count > 0 ? `font-medium ${textClass}` : "text-white/25"}>
                  {count > 0 ? `${count} event${count === 1 ? "" : "s"}` : "none"}
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${count > 0 ? "bg-current " + textClass : ""}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {total === 0 && (
        <p className="text-xs text-white/25">No events tracked right now</p>
      )}
    </div>
  );
}
