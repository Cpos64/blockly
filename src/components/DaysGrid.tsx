"use client";

import { useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/types";
import { dayOfWeek, todayISO } from "@/lib/date-utils";
import { START_HOUR, TOTAL_HEIGHT, PX_PER_MIN, hourLabel } from "@/lib/grid-constants";
import DayColumn from "@/components/DayColumn";

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DaysGrid({
  dates,
  items,
  onDropItem,
  onCreateRange,
  onBlockClick,
  onToggleComplete,
  onResizeItem,
  compact = false,
}: {
  dates: string[]; // dates to render, one column each
  items: Item[]; // scheduled items across all shown dates
  onDropItem: (itemId: string, date: string, startTime: string) => void;
  onCreateRange: (
    date: string,
    startTime: string,
    durationMinutes: number,
    origin: { x: number; y: number },
  ) => void;
  onBlockClick: (item: Item, origin: { x: number; y: number }) => void;
  onToggleComplete: (item: Item) => void;
  onResizeItem: (
    itemId: string,
    changes: { startTime?: string; durationMinutes: number },
  ) => void;
  compact?: boolean;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const today = todayISO();
  const gridTemplateColumns = `56px repeat(${dates.length}, 1fr)`;

  const hourMarks: number[] = [];
  for (let h = START_HOUR; h < 24; h++) hourMarks.push(h);

  return (
    <div style={{ minWidth: compact ? 820 : 480 }}>
      <div className="grid" style={{ gridTemplateColumns }}>
        <div />
        {dates.map((d) => {
          const [, month, day] = d.split("-");
          const isToday = d === today;
          return (
            <Link
              key={d}
              href={`/plan?view=day&date=${d}`}
              className={`flex flex-col items-center gap-0.5 border-b border-neutral-200 py-2 text-center transition hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800 ${
                isToday ? "bg-indigo-50 dark:bg-indigo-950/40" : ""
              }`}
            >
              <span className="text-[11px] uppercase tracking-wide text-neutral-400">
                {WEEKDAY_ABBR[dayOfWeek(d)]}
              </span>
              <span
                className={`text-sm font-semibold ${
                  isToday
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"
                    : "text-neutral-700 dark:text-neutral-200"
                }`}
              >
                {Number(day)}
              </span>
              <span className="sr-only">{month}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns }}>
        <div style={{ height: TOTAL_HEIGHT }} className="relative">
          {hourMarks.map((h) => (
            <div
              key={h}
              style={{ top: (h * 60 - START_HOUR * 60) * PX_PER_MIN }}
              className="absolute w-14 -translate-y-2 pr-2 text-right text-xs text-neutral-400"
            >
              {hourLabel(h)}
            </div>
          ))}
        </div>

        {dates.map((d) => (
          <DayColumn
            key={d}
            date={d}
            items={items.filter((i) => i.date === d)}
            onDropItem={onDropItem}
            onCreateRange={onCreateRange}
            onBlockClick={onBlockClick}
            onToggleComplete={onToggleComplete}
            onResizeItem={onResizeItem}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
