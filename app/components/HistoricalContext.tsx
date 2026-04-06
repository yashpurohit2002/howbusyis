interface Props {
  percentile?: number;
  score: number;
}

export function HistoricalContext({ percentile, score }: Props) {
  if (percentile === undefined) return null;

  let copy: string;
  if (percentile >= 80) {
    copy = `Today is busier than ${percentile}% of recent days. It's a lot right now.`;
  } else if (percentile >= 50) {
    copy = `Busier than ${percentile}% of recent days. Above average.`;
  } else if (percentile >= 20) {
    copy = `Busier than ${percentile}% of recent days. Pretty normal.`;
  } else {
    copy = `Quieter than ${100 - percentile}% of recent days. Enjoy it.`;
  }

  return (
    <p className="text-xs text-white/30 text-center">{copy}</p>
  );
}
