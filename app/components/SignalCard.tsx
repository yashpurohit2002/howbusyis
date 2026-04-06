import { SignalResult } from "@/app/lib/types";

const ICONS: Record<string, string> = {
  MTA: "🚇",
  Weather: "🌤",
  Events: "🎟",
  "311 Noise": "📢",
  "Time of Day": "🕐",
};

const SHORT_LABELS: Record<string, string> = {
  "311 Noise": "Noise",
  "Time of Day": "Time",
};

interface SignalCardProps {
  signal: SignalResult;
  textClass: string;
}

export function SignalCard({ signal, textClass }: SignalCardProps) {
  const icon = ICONS[signal.label] ?? "📊";
  const pips = Math.round(signal.score);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/60">
          {icon} {SHORT_LABELS[signal.label] ?? signal.label}
        </span>
        <span className={`text-xs font-bold ${signal.error ? "text-white/30" : textClass}`}>
          {pips}/10
        </span>
      </div>
      <p className="text-sm text-white/80 leading-snug">{signal.detail}</p>
      {/* Mini pip bar */}
      <div className="flex gap-1 mt-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < pips ? (signal.error ? "bg-white/20" : "bg-current") : "bg-white/10"
            } ${textClass}`}
          />
        ))}
      </div>
    </div>
  );
}
