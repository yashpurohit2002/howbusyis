import { EventItem } from "@/app/lib/types";
import { LINE_COLORS } from "@/app/lib/nyc-data";

interface Props {
  events: EventItem[];
  textClass: string;
}

const CROWD_CONFIG = {
  Small:  { label: "Small",  color: "bg-emerald-900 text-emerald-400" },
  Medium: { label: "Medium", color: "bg-yellow-900 text-yellow-400" },
  Packed: { label: "Packed", color: "bg-red-900 text-red-400" },
};

// Major venues that cause significant neighborhood crowd impact
const MAJOR_VENUES = [
  "madison square garden", "msg", "barclays center", "yankee stadium",
  "citi field", "metlife", "forest hills stadium", "queens theater",
  "radio city", "carnegie hall", "terminal 5", "irving plaza",
  "united palace", "apollo theater", "brooklyn bowl", "kings theatre",
  "prudential center",
];

function isMajorVenue(venue: string): boolean {
  const v = venue.toLowerCase();
  return MAJOR_VENUES.some((m) => v.includes(m));
}

function LineBadge({ line }: { line: string }) {
  const color = LINE_COLORS[line] ?? "#808183";
  const isDark = ["N","Q","R","W"].includes(line);
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black"
      style={{ backgroundColor: color, color: isDark ? "#000" : "#fff" }}
    >
      {line}
    </span>
  );
}

function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export function EventFeed({ events, textClass }: Props) {
  if (events.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-white/40 text-sm">No major events right now. NYC is winging it.</p>
      </div>
    );
  }

  const bigEvents = events.filter((e) => e.crowdSize === "Packed" && isMajorVenue(e.venue));

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {bigEvents.length > 0 && (
        <div className="px-4 py-2 bg-orange-950/60 border-b border-orange-800/40 flex items-center gap-2">
          <span className="text-base">🏟️</span>
          <p className="text-xs text-orange-300 font-medium">
            {bigEvents.length === 1
              ? `${bigEvents[0].venue} tonight. Expect heavy crowds nearby.`
              : `${bigEvents.length} stadium-level events. Several neighborhoods will be packed.`}
          </p>
        </div>
      )}
      <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
        {events.map((ev) => {
          const crowd = CROWD_CONFIG[ev.crowdSize];
          const major = isMajorVenue(ev.venue);
          return (
            <div key={ev.id} className={`px-4 py-3 hover:bg-white/5 transition-colors ${major && ev.crowdSize === "Packed" ? "border-l-2 border-orange-700/60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Event name -- link to TM if available */}
                  {ev.url ? (
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-white/70 transition-colors truncate block"
                    >
                      {ev.name} ↗
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-white truncate">{ev.name}</p>
                  )}
                  <p className="text-xs text-white/40 truncate">
                    {ev.venue}
                    {ev.source === "nyc-open-data" && (
                      <span className="ml-1.5 text-[10px] text-white/25">NYC permit</span>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <p className={`text-xs font-medium ${textClass}`}>{ev.startTime}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${crowd.color}`}>
                    {crowd.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1.5">
                {ev.lines.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-white/25">Lines:</span>
                    <div className="flex gap-0.5">
                      {ev.lines.slice(0, 6).map((l) => (
                        <LineBadge key={l} line={l} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Directions link */}
                {ev.address && ev.address.trim().length > 3 && (
                  <a
                    href={mapsUrl(`${ev.venue}, ${ev.address}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors ml-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Directions
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
