"use client";

import type { Item } from "@/lib/types";
import { START_HOUR, TOTAL_HEIGHT, PX_PER_MIN, hourLabel } from "@/lib/grid-constants";
import DayColumn from "@/components/DayColumn";

export default function TimeGrid({
  date,
  items,
  onDropItem,
  onCreateRange,
  onBlockClick,
}: {
  date: string;
  items: Item[]; // scheduled items only (start_time set)
  onDropItem: (itemId: string, date: string, startTime: string) => void;
  onCreateRange: (date: string, startTime: string, durationMinutes: number) => void;
  onBlockClick: (item: Item) => void;
}) {
  const hourMarks: number[] = [];
  for (let h = START_HOUR; h < 24; h++) hourMarks.push(h);

  return (
    <div className="grid" style={{ gridTemplateColumns: "56px 1fr" }}>
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

      <DayColumn
        date={date}
        items={items}
        onDropItem={onDropItem}
        onCreateRange={onCreateRange}
        onBlockClick={onBlockClick}
      />
    </div>
  );
}
