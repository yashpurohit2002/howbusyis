"use client";

import { useState } from "react";
import { WeatherSignalResult } from "@/app/lib/types";

interface Props {
  weather: WeatherSignalResult;
  textClass: string;
}

const toC = (f: number) => Math.round((f - 32) * 5 / 9);

function SparklineBar({ pop, temp, hour, icon, maxTemp, minTemp, celsius }: {
  pop: number; temp: number; hour: string; icon: string;
  maxTemp: number; minTemp: number; celsius: boolean;
}) {
  const display = celsius ? toC(temp) : temp;
  const displayMax = celsius ? toC(maxTemp) : maxTemp;
  const displayMin = celsius ? toC(minTemp) : minTemp;
  const tempRange = displayMax - displayMin || 1;
  const heightPct = Math.round(((display - displayMin) / tempRange) * 60 + 20);
  const rainAlpha = Math.round(pop * 100);

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs text-white/60">{display}&deg;</span>
      <div className="w-full flex-1 flex items-end justify-center" style={{ height: "48px" }}>
        <div
          className="w-full max-w-5 rounded-t"
          style={{
            height: `${heightPct}%`,
            backgroundColor: pop > 0.5 ? `rgba(96,165,250,${0.4 + pop * 0.6})` : "rgba(255,255,255,0.2)",
          }}
        />
      </div>
      <span className="text-base">{icon}</span>
      {pop > 0.1 && <span className="text-xs text-blue-400">{rainAlpha}%</span>}
      <span className="text-xs text-white/30">{hour}</span>
    </div>
  );
}

export function WeatherCard({ weather, textClass }: Props) {
  const [celsius, setCelsius] = useState(false);

  if (weather.error && !weather.temp) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-sm text-white/40">{weather.detail}</p>
      </div>
    );
  }

  const temp = celsius ? toC(weather.temp) : weather.temp;
  const feelsLike = celsius ? toC(weather.feelsLike) : weather.feelsLike;
  const unit = celsius ? "C" : "F";

  const temps = weather.hourly.map((h) => h.temp);
  const maxTemp = temps.length > 0 ? Math.max(...temps) : weather.temp;
  const minTemp = temps.length > 0 ? Math.min(...temps) : weather.temp;

  // Umbrella check: look at next ~6h (2 hourly slots)
  const nextHours = weather.hourly.slice(0, 3);
  const maxRainPop = nextHours.length > 0 ? Math.max(...nextHours.map((h) => h.pop)) : 0;
  const umbrellaHour = nextHours.find((h) => h.pop >= 0.3);
  const showUmbrella = maxRainPop >= 0.3;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">{temp}</span>
            <div className="flex items-center gap-1 mb-1.5">
              <button
                onClick={() => setCelsius(false)}
                className={`text-lg font-bold transition-colors cursor-pointer ${!celsius ? "text-white" : "text-white/25 hover:text-white/50"}`}
              >
                F
              </button>
              <span className="text-white/20">/</span>
              <button
                onClick={() => setCelsius(true)}
                className={`text-lg font-bold transition-colors cursor-pointer ${celsius ? "text-white" : "text-white/25 hover:text-white/50"}`}
              >
                C
              </button>
            </div>
          </div>
          <p className="text-white/50 text-sm">Feels like {feelsLike}&deg;{unit}</p>
        </div>
        <div className="text-right space-y-1">
          {weather.windSpeed > 0 && (
            <p className="text-sm text-white/50">
              {weather.windSpeed > 20 ? "💨" : "🌬"} {weather.windSpeed} mph winds
            </p>
          )}
          {weather.humidity > 0 && (
            <p className="text-sm text-white/50">{weather.humidity}% humidity</p>
          )}
        </div>
      </div>

      {/* Umbrella alert */}
      {showUmbrella && (
        <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 rounded-xl px-3 py-2">
          <span className="text-lg">☂️</span>
          <p className="text-sm text-blue-300 font-medium">
            Rain likely{umbrellaHour ? ` around ${umbrellaHour.hour}` : " soon"}. Bring an umbrella.
          </p>
        </div>
      )}

      {/* Impact line */}
      <div className={`text-sm font-medium ${textClass} rounded-xl px-3 py-2 bg-white/5`}>
        {weather.impact}
      </div>

      {/* Score contribution */}
      <p className="text-xs text-white/30">
        Weather is adding +{weather.scoreContribution} to chaos today
      </p>

      {/* Hourly sparkline */}
      {weather.hourly.length > 0 && (
        <div>
          <p className="text-xs text-white/30 mb-2">Next {weather.hourly.length * 3}h</p>
          <div className="flex gap-1 items-stretch" style={{ height: "100px" }}>
            {weather.hourly.map((h) => (
              <SparklineBar
                key={h.hour}
                pop={h.pop}
                temp={h.temp}
                hour={h.hour}
                icon={h.icon}
                maxTemp={maxTemp}
                minTemp={minTemp}
                celsius={celsius}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
