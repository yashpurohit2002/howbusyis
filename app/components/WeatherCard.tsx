import { WeatherSignalResult } from "@/app/lib/types";

interface Props {
  weather: WeatherSignalResult;
  textClass: string;
}

function SparklineBar({ pop, temp, hour, icon, maxTemp, minTemp }: {
  pop: number; temp: number; hour: string; icon: string; maxTemp: number; minTemp: number;
}) {
  const tempRange = maxTemp - minTemp || 1;
  const heightPct = Math.round(((temp - minTemp) / tempRange) * 60 + 20); // 20-80%
  const rainAlpha = Math.round(pop * 100);

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <span className="text-xs text-white/60">{temp}F</span>
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
      {pop > 0.1 && (
        <span className="text-xs text-blue-400">{rainAlpha}%</span>
      )}
      <span className="text-xs text-white/30">{hour}</span>
    </div>
  );
}

export function WeatherCard({ weather, textClass }: Props) {
  if (weather.error && !weather.temp) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-sm text-white/40">{weather.detail}</p>
      </div>
    );
  }

  const temps = weather.hourly.map((h) => h.temp);
  const maxTemp = temps.length > 0 ? Math.max(...temps) : weather.temp;
  const minTemp = temps.length > 0 ? Math.min(...temps) : weather.temp;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black text-white">{weather.temp}</span>
            <span className="text-white/40 text-xl mb-1.5">F</span>
          </div>
          <p className="text-white/50 text-sm">Feels like {weather.feelsLike}F</p>
        </div>
        <div className="text-right space-y-1">
          {weather.windSpeed > 0 && (
            <p className="text-sm text-white/50">
              {weather.windSpeed > 20 ? "💨" : "🌬"} {weather.windSpeed} mph winds
            </p>
          )}
          {weather.humidity > 0 && (
            <p className="text-sm text-white/50">
              {weather.humidity}% humidity
            </p>
          )}
        </div>
      </div>

      {/* Impact line */}
      <div className={`text-sm font-medium ${textClass} bg-current/10 rounded-xl px-3 py-2 bg-white/5`}>
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
