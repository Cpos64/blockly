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
  onToggleComplete,
  onResizeItem,
  selectedItemId,
  onSelectItem,
  compact = false,
}: {
  date: string;
  items: Item[]; // scheduled items for this date only
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
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragCreate, setDragCreate] = useState<{
    startMin: number;
    endMin: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizePreview, setResizePreview] = useState<{
    itemId: string;
    startMin: number;
    durationMinutes: number;
  } | null>(null);

  const isToday = date === todayISO();
  const nowMinutes = useNowMinutes();

  useEffect(() => {
    if (!isDragging) return;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  function yToMinutes(clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect();
    const relY = clientY - rect.top;
    const raw = START_HOUR * 60 + relY / PX_PER_MIN;
    const clamped = Math.min(Math.max(raw, START_HOUR * 60), END_HOUR * 60);
    return Math.round(clamped / SNAP_MINUTES) * SNAP_MINUTES;
  }

  function handleSlotMouseDown(startMin: number) {
    onSelectItem(null);
    let endMin = startMin + SLOT_MINUTES;
    setDragCreate({ startMin, endMin });
    setIsDragging(true);

    function handleMove(ev: MouseEvent) {
      const m = yToMinutes(ev.clientY);
      endMin = Math.max(startMin + SNAP_MINUTES, m);
      setDragCreate({ startMin, endMin });
    }

    function handleUp(ev: MouseEvent) {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      setIsDragging(false);
      setDragCreate(null);
      onCreateRange(date, minutesToTime(startMin), endMin - startMin, {
        x: ev.clientX,
        y: ev.clientY,
      });
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  function handleResizeMouseDown(
    e: React.MouseEvent,
    item: Item,
    edge: "top" | "bottom",
  ) {
    e.preventDefault();
    e.stopPropagation();
    const origStartMin = timeToMinutes(item.start_time!);
    const origEndMin = origStartMin + item.duration_minutes;
    let startMin = origStartMin;
    let durationMinutes = item.duration_minutes;
    setResizePreview({ itemId: item.id, startMin, durationMinutes });
    setIsDragging(true);

    function handleMove(ev: MouseEvent) {
      const m = yToMinutes(ev.clientY);
      if (edge === "bottom") {
        durationMinutes = Math.max(SNAP_MINUTES, m - origStartMin);
      } else {
        startMin = Math.min(m, origEndMin - SNAP_MINUTES);
        durationMinutes = origEndMin - startMin;
      }
      setResizePreview({ itemId: item.id, startMin, durationMinutes });
    }

    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      setIsDragging(false);
      setResizePreview(null);
      if (durationMinutes !== item.duration_minutes || startMin !== origStartMin) {
        onResizeItem(item.id, {
          startTime: edge === "top" ? minutesToTime(startMin) : undefined,
          durationMinutes,
        });
      }
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
          const isSelected = selectedItemId === item.id;
          const preview = resizePreview?.itemId === item.id ? resizePreview : null;
          const effectiveDuration = preview ? preview.durationMinutes : item.duration_minutes;
          const startMin = preview ? preview.startMin : timeToMinutes(item.start_time!);
          const top = (startMin - START_HOUR * 60) * PX_PER_MIN;
          const height = Math.max(effectiveDuration * PX_PER_MIN, 18);
          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem(isSelected ? null : item.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onBlockClick(item, { x: e.clientX, y: e.clientY });
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
              } ${isSelected ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900" : ""}`}
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(item);
                  }}
                  aria-label={item.completed ? "Mark incomplete" : "Mark done"}
                  style={{
                    borderColor: item.color,
                    backgroundColor: item.completed ? item.color : "transparent",
                  }}
                  className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border"
                >
                  {item.completed && (
                    <span className="text-[7px] leading-none text-white">
                      ✓
                    </span>
                  )}
                </button>
                <div
                  className={`truncate font-medium text-neutral-800 dark:text-neutral-100 ${
                    item.completed ? "line-through" : ""
                  } ${compact ? "text-[11px]" : ""}`}
                >
                  {item.title}
                </div>
              </div>
              {height > 30 && !compact && (
                <div className="truncate text-neutral-500 dark:text-neutral-400">
                  {formatTime(item.start_time!)} · {effectiveDuration}m
                </div>
              )}
              {isSelected && (
                <>
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(e, item, "top")}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-x-0 top-0 h-2 cursor-row-resize"
                  >
                    <div className="mx-auto mt-0.5 h-0.5 w-6 rounded-full bg-indigo-500" />
                  </div>
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(e, item, "bottom")}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-x-0 bottom-0 h-2 cursor-row-resize"
                  >
                    <div className="mx-auto mt-1.5 h-0.5 w-6 rounded-full bg-indigo-500" />
                  </div>
                </>
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
