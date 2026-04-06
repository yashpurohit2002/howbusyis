import { GoOutVerdict } from "@/app/lib/verdict";

interface Props {
  verdict: GoOutVerdict;
}

const MOOD_STYLE = {
  positive: { bg: "bg-emerald-950", border: "border-emerald-800" },
  cautious:  { bg: "bg-yellow-950", border: "border-yellow-800" },
  warning:   { bg: "bg-red-950",    border: "border-red-800" },
};

export function GoOutMode({ verdict }: Props) {
  const style = MOOD_STYLE[verdict.mood];

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
