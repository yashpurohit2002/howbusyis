import { DsnySignalResult } from "@/app/lib/types";

interface Props {
  dsny: DsnySignalResult;
  textClass: string;
}

const LABEL_COLOR: Record<string, string> = {
  "Acceptable":       "text-emerald-400",
  "Chaotic":          "text-yellow-400",
  "Do not look down.": "text-red-400",
  "Unknown":          "text-white/30",
};

export function StreetCard({ dsny, textClass }: Props) {
  const labelColor = LABEL_COLOR[dsny.streetLabel] ?? textClass;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/60">🗑 Streets</span>
        <span className={`text-xs font-bold ${dsny.error ? "text-white/30" : labelColor}`}>
          {dsny.streetLabel}
        </span>
      </div>
      <p className="text-sm text-white/80 leading-snug">{dsny.detail}</p>
    </div>
  );
}
