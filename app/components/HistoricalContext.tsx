interface Props {
  percentile?: number;
  score: number;
  historicalScores?: number[];
}

function Sparkline({ scores, current }: { scores: number[]; current: number }) {
  const all = [...scores];
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 100);
  const range = max - min || 1;
  const W = 120;
  const H = 28;
  const pad = 2;

  const pts = all.map((s, i) => {
    const x = pad + (i / Math.max(all.length - 1, 1)) * (W - pad * 2);
    const y = H - pad - ((s - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastX = pad + ((all.length - 1) / Math.max(all.length - 1, 1)) * (W - pad * 2);
  const lastY = H - pad - ((current - min) / range) * (H - pad * 2);

  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

function getQuippyLine(percentile: number): string {
  const day = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/New_York",
  });
  const hour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  ).getHours();
  const isNight = hour >= 20 || hour < 4;
  const isMorning = hour >= 6 && hour < 11;

  if (percentile >= 90) {
    return "Busier than almost any day on record. Something is definitely going on.";
  }
  if (percentile >= 78) {
    if (isNight) return `Running hotter than usual for a ${day} night. The city has extra energy.`;
    return `More chaotic than most ${day}s. Not a fluke.`;
  }
  if (percentile >= 62) {
    if (isNight) return `Slightly busier than your average ${day} night. Nothing crazy.`;
    return `A little above the usual ${day} baseline.`;
  }
  if (percentile >= 42) {
    if (isMorning) return `Pretty standard ${day} morning energy.`;
    return `Right in line with a typical ${day}. Business as usual.`;
  }
  if (percentile >= 28) {
    return `Calmer than most ${day}s lately. A good window.`;
  }
  if (percentile >= 12) {
    if (isNight) return `Unusually quiet for a ${day} night. The city took a breath.`;
    return `Much calmer than the average ${day}. Take advantage of it.`;
  }
  return `One of the quietest days in recent memory. Go enjoy it before it's gone.`;
}

export function HistoricalContext({ percentile, score, historicalScores }: Props) {
  if (percentile === undefined && !historicalScores?.length) return null;

  const copy = percentile !== undefined
    ? getQuippyLine(percentile)
    : "Still building history. Check back tomorrow.";

  return (
    <div className="flex flex-col items-center gap-1.5">
      {historicalScores && historicalScores.length > 2 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20">7d</span>
          <Sparkline scores={historicalScores} current={score} />
          <span className="text-[10px] text-white/20">now</span>
        </div>
      )}
      <p className="text-xs text-white/30 text-center italic">{copy}</p>
    </div>
  );
}
