"use client";

import { useEffect, useState } from "react";

interface ScoreBarProps {
  score: number;
  barClass: string;
}

export function ScoreBar({ score, barClass }: ScoreBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 100);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="w-full max-w-md h-3 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${barClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
