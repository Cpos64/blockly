"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/lib/types";
import { formatTime, minutesToTime, timeToMinutes, todayISO } from "@/lib/date-utils";
import {
  START_HOUR,
  END_HOUR,
  SLOT_MINUTES,
  SNAP_MINUTES,
  PX_PER_MIN,
  TOTAL_HEIGHT,
  buildSlots,
} from "@/lib/grid-constants";

const SLOTS = buildSlots();

function useNowMinutes() {
  const [minutes, setMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return minutes;
}

export default function DayColumn({
  date,
  items,
  onDropItem,
  onCreateRange,
  onBlockClick,
  compact = false,
}: {
  date: string;
  items: Item[]; // scheduled items for this date only
  onDropItem: (itemId: string, date: string, startTime: string) => void;
  onCreateRange: (date: string, startTime: string, durationMinutes: number) => void;
  onBlockClick: (item: Item) => void;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragCreate, setDragCreate] = useState<{
    startMin: number;
    endMin: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isToday = date === todayISO();
  const nowMinutes = useNowMinutes();

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  function minutesFor(time: string) {
    return timeToMinutes(time) - START_HOUR * 60;
  }

  function yToMinutes(clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect();
    const relY = clientY - rect.top;
    const raw = START_HOUR * 60 + relY / PX_PER_MIN;
    const clamped = Math.min(Math.max(raw, START_HOUR * 60), END_HOUR * 60);
    return Math.round(clamped / SNAP_MINUTES) * SNAP_MINUTES;
  }

  function handleSlotMouseDown(startMin: number) {
    let endMin = startMin + SLOT_MINUTES;
    setDragCreate({ startMin, endMin });
    setIsDragging(true);

    function handleMove(ev: MouseEvent) {
      const m = yToMinutes(ev.clientY);
      endMin = Math.max(startMin + SNAP_MINUTES, m);
      setDragCreate({ startMin, endMin });
    }

    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      setIsDragging(false);
      setDragCreate(null);
      onCreateRange(date, minutesToTime(startMin), endMin - startMin);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  const showNowLine = isToday && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  return (
    <div
      ref={containerRef}
      className="relative border-l border-neutral-200 dark:border-neutral-800"
      style={{ height: TOTAL_HEIGHT }}
    >
      {SLOTS.map((m) => (
        <div
          key={m}
          onMouseDown={() => handleSlotMouseDown(m)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData("text/plain");
            if (itemId) onDropItem(itemId, date, minutesToTime(m));
          }}
          style={{ height: SLOT_MINUTES * PX_PER_MIN }}
          className={`cursor-pointer border-t hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 ${
            m % 60 === 0
              ? "border-neutral-200 dark:border-neutral-800"
              : "border-neutral-100 dark:border-neutral-900"
          }`}
        />
      ))}

      <div className="pointer-events-none absolute inset-0">
        {items.map((item) => {
          const top = minutesFor(item.start_time!) * PX_PER_MIN;
          const height = Math.max(item.duration_minutes * PX_PER_MIN, 18);
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
              onClick={(e) => {
                e.stopPropagation();
                onBlockClick(item);
              }}
              style={{
                top,
                height,
                left: 3,
                right: 3,
                backgroundColor: item.color + "22",
                borderColor: item.color,
              }}
              className={`pointer-events-auto absolute cursor-grab overflow-hidden rounded-md border-l-4 px-1.5 py-0.5 text-xs shadow-sm active:cursor-grabbing ${
                item.completed ? "opacity-50" : ""
              }`}
            >
              <div
                className={`truncate font-medium text-neutral-800 dark:text-neutral-100 ${
                  item.completed ? "line-through" : ""
                } ${compact ? "text-[11px]" : ""}`}
              >
                {item.title}
              </div>
              {height > 30 && !compact && (
                <div className="truncate text-neutral-500 dark:text-neutral-400">
                  {formatTime(item.start_time!)} · {item.duration_minutes}m
                </div>
              )}
            </div>
          );
        })}

        {dragCreate && (
          <div
            style={{
              top: (dragCreate.startMin - START_HOUR * 60) * PX_PER_MIN,
              height: (dragCreate.endMin - dragCreate.startMin) * PX_PER_MIN,
              left: 3,
              right: 3,
            }}
            className="absolute rounded-md border-2 border-dashed border-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300"
          >
            {formatTime(minutesToTime(dragCreate.startMin))} ·{" "}
            {dragCreate.endMin - dragCreate.startMin}m
          </div>
        )}

        {showNowLine && (
          <div
            style={{ top: (nowMinutes - START_HOUR * 60) * PX_PER_MIN }}
            className="absolute left-0 right-0 z-10"
          >
            <div className="relative">
              <div className="absolute -left-1 -top-[5px] h-2.5 w-2.5 rounded-full bg-red-500" />
              <div className="h-px bg-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
