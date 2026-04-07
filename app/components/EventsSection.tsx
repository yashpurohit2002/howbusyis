"use client";

import { useEffect, useRef, useState } from "react";
import { EventItem } from "@/app/lib/types";
import { EventFeed } from "./EventFeed";
import { BoroughMap } from "./BoroughMap";

interface Props {
  todayEvents: EventItem[];
  todayByBorough: Record<string, number>;
  textClass: string;
  accentClass: string;
}

function toNycDateString(offset: number): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function formatPill(offset: number): { label: string; sub: string } {
  if (offset === 0) return { label: "Today", sub: "" };
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  d.setDate(d.getDate() + offset);
  const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
  return { label: day, sub: date };
}

export function EventsSection({ todayEvents, todayByBorough, textClass, accentClass }: Props) {
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [fetchedEvents, setFetchedEvents] = useState<EventItem[] | null>(null);
  const [fetchedByBorough, setFetchedByBorough] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When offset changes to non-today, fetch events
  useEffect(() => {
    if (selectedOffset === 0) {
      setFetchedEvents(null);
      return;
    }
    const date = toNycDateString(selectedOffset);
    setLoading(true);
    setFetchedEvents(null);
    fetch(`/api/events?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        const events: EventItem[] = d.events ?? [];
        const byBorough: Record<string, number> = {};
        for (const ev of events) {
          byBorough[ev.borough] = (byBorough[ev.borough] ?? 0) + 1;
        }
        setFetchedEvents(events);
        setFetchedByBorough(byBorough);
      })
      .catch(() => setFetchedEvents([]))
      .finally(() => setLoading(false));
  }, [selectedOffset]);

  const activeEvents = selectedOffset === 0 ? todayEvents : (fetchedEvents ?? []);
  const activeByBorough = selectedOffset === 0 ? todayByBorough : fetchedByBorough;

  const selectedDate = toNycDateString(selectedOffset);
  const selectedLabel =
    selectedOffset === 0
      ? "happening now"
      : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        });

  return (
    <div className="space-y-3">
      {/* Date pill row */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {Array.from({ length: 30 }, (_, i) => {
          const { label, sub } = formatPill(i);
          const active = selectedOffset === i;
          return (
            <button
              key={i}
              onClick={() => setSelectedOffset(i)}
              className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                active
                  ? `border-white/30 bg-white/15 text-white`
                  : "border-white/10 bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/8"
              }`}
            >
              <span>{label}</span>
              {sub && <span className={`text-[10px] ${active ? "text-white/60" : "text-white/25"}`}>{sub}</span>}
            </button>
          );
        })}
      </div>

      {/* Detail line */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${accentClass}`}>
          {loading
            ? "Loading..."
            : activeEvents.length === 0
            ? "Nothing found"
            : `${activeEvents.length} event${activeEvents.length === 1 ? "" : "s"} ${selectedLabel}`}
        </span>
      </div>

      {loading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-white/30 text-sm animate-pulse">Checking Ticketmaster...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <EventFeed events={activeEvents} textClass={textClass} />
          <BoroughMap byBorough={activeByBorough} textClass={textClass} />
        </div>
      )}
    </div>
  );
}
