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
    const x = pad + (i / (all.length - 1)) * (W - pad * 2);
    const y = H - pad - ((s - min) / range) * (H - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastX = pad + ((all.length - 1) / (all.length - 1)) * (W - pad * 2);
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

export function HistoricalContext({ percentile, score, historicalScores }: Props) {
  if (percentile === undefined && !historicalScores?.length) return null;

  let copy: string;
  if (percentile === undefined) {
    copy = "Building history...";
  } else if (percentile >= 80) {
    copy = `Busier than ${percentile}% of recent days`;
  } else if (percentile >= 50) {
    copy = `Above average — busier than ${percentile}% of recent days`;
  } else if (percentile >= 20) {
    copy = `Pretty normal — busier than ${percentile}% of recent days`;
  } else {
    copy = `Quieter than ${100 - percentile}% of recent days — enjoy it`;
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      {historicalScores && historicalScores.length > 2 && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/20">7d</span>
          <Sparkline scores={historicalScores} current={score} />
          <span className="text-[10px] text-white/20">now</span>
        </div>
      )}
      <p className="text-xs text-white/30 text-center">{copy}</p>
    </div>
  );
}
