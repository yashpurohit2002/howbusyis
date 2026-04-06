import { GoOutVerdict } from "@/app/lib/verdict";

interface Props {
  verdict: GoOutVerdict;
}

const VERDICT_STYLE = {
  YES:        { emoji: "✓", bg: "bg-emerald-950", border: "border-emerald-800" },
  MAYBE:      { emoji: "?", bg: "bg-yellow-950",  border: "border-yellow-800" },
  "STAY HOME":{ emoji: "✕", bg: "bg-red-950",     border: "border-red-800" },
};

export function GoOutMode({ verdict }: Props) {
  const style = VERDICT_STYLE[verdict.verdict];

  return (
    <div className={`${style.bg} border ${style.border} rounded-2xl p-6 space-y-3 text-center`}>
      <div className={`text-6xl font-black ${verdict.color}`}>
        {verdict.verdict}
      </div>
      <p className="text-white/60 text-base leading-relaxed max-w-sm mx-auto">
        {verdict.reason}
      </p>
    </div>
  );
}
