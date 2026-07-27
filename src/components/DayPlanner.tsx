"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Item } from "@/lib/types";
import { updateItem } from "@/app/plan/actions";
import { addDays, formatShortDate, formatTime, todayISO } from "@/lib/date-utils";
import { START_HOUR, PX_PER_MIN } from "@/lib/grid-constants";
import DaysGrid from "@/components/DaysGrid";
import ItemDrawer, { type ItemDraft } from "@/components/ItemDrawer";

function dayLabel(date: string): string {
  const today = todayISO();
  if (date === today) return "Today";
  if (date === addDays(today, 1)) return "Tomorrow";
  return formatShortDate(date);
}

export default function DayPlanner({
  date,
  initialItems,
}: {
  date: string;
  initialItems: Item[]; // scheduled + backlog items for `date` and the following day
}) {
  const nextDate = addDays(date, 1);
  const dates = [date, nextDate];

  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLElement>(null);

  // Re-sync local state when the server gives us a fresh items list (e.g.
  // after a revalidation), without the cascading-render effect antipattern.
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  useEffect(() => {
    const today = todayISO();
    if ((date !== today && nextDate !== today) || !scrollRef.current) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const top = (nowMinutes - START_HOUR * 60) * PX_PER_MIN;
    scrollRef.current.scrollTop = Math.max(top - 160, 0);
  }, [date, nextDate]);

  const scheduled = items.filter((i) => i.start_time);

  function blankDraft(
    forDate: string,
    startTime: string | null,
    durationMinutes = 30,
    origin?: { x: number; y: number },
  ): ItemDraft {
    return {
      date: forDate,
      title: "",
      notes: "",
      startTime,
      durationMinutes,
      completed: false,
      origin,
    };
  }

  function editDraft(item: Item, origin?: { x: number; y: number }): ItemDraft {
    return {
      id: item.id,
      date: item.date,
      title: item.title,
      notes: item.notes ?? "",
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      completed: item.completed,
      routineId: item.routine_id,
      origin,
    };
  }

  function reschedule(itemId: string, forDate: string, startTime: string | null) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId ? { ...i, date: forDate, start_time: startTime } : i,
      ),
    );
    startTransition(async () => {
      await updateItem(itemId, { date: forDate, startTime });
    });
  }

  function toggleComplete(item: Item) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, completed: !i.completed } : i,
      ),
    );
    startTransition(async () => {
      await updateItem(item.id, { completed: !item.completed });
    });
  }

  function resizeItem(
    itemId: string,
    changes: { startTime?: string; durationMinutes: number },
  ) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              start_time: changes.startTime ?? i.start_time,
              duration_minutes: changes.durationMinutes,
            }
          : i,
      ),
    );
    startTransition(async () => {
      await updateItem(itemId, {
        startTime: changes.startTime,
        durationMinutes: changes.durationMinutes,
      });
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-full max-w-xs shrink-0 flex-col gap-4 overflow-y-auto border-r border-neutral-200 p-4 dark:border-neutral-800">
        {(() => {
          const backlog = items.filter((i) => !i.start_time && i.date === date);
          return (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Backlog
                </h2>
                <button
                  onClick={(e) =>
                    setDraft(blankDraft(date, null, 30, { x: e.clientX, y: e.clientY }))
                  }
                  className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-500"
                >
                  + Add task
                </button>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const itemId = e.dataTransfer.getData("text/plain");
                  if (itemId) reschedule(itemId, date, null);
                }}
                className="flex min-h-[64px] flex-col gap-2 rounded-lg border border-dashed border-neutral-300 p-2 dark:border-neutral-700"
              >
                {backlog.length === 0 && (
                  <p className="p-2 text-xs text-neutral-400">
                    Nothing here. Add a task, or drag a block back to unschedule it.
                  </p>
                )}
                {backlog.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", item.id)
                    }
                    style={{ borderColor: item.color }}
                    className={`flex cursor-grab items-start gap-2 rounded-md border-l-4 bg-white px-3 py-2 text-sm shadow-sm transition active:cursor-grabbing dark:bg-neutral-900 ${
                      item.completed ? "opacity-50" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleComplete(item)}
                      aria-label={item.completed ? "Mark incomplete" : "Mark done"}
                      style={{
                        borderColor: item.color,
                        backgroundColor: item.completed ? item.color : "transparent",
                      }}
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                    >
                      {item.completed && (
                        <span className="text-[10px] leading-none text-white">
                          ✓
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) =>
                        setDraft(editDraft(item, { x: e.clientX, y: e.clientY }))
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <div
                        className={`truncate font-medium text-neutral-800 dark:text-neutral-100 ${
                          item.completed ? "line-through" : ""
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {item.duration_minutes} min
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {scheduled.length > 0 && (
          <div className="mt-2">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
              At a glance
            </h3>
            <ul className="space-y-1 text-xs text-neutral-500">
              {scheduled.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {dayLabel(i.date)} · {i.title}
                  </span>
                  <span className="shrink-0">{formatTime(i.start_time!)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <section
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-auto bg-white p-3 dark:bg-neutral-900"
      >
        <DaysGrid
          dates={dates}
          items={scheduled}
          onDropItem={reschedule}
          onCreateRange={(forDate, startTime, durationMinutes, origin) =>
            setDraft(blankDraft(forDate, startTime, durationMinutes, origin))
          }
          onBlockClick={(item, origin) => setDraft(editDraft(item, origin))}
          onToggleComplete={toggleComplete}
          onResizeItem={resizeItem}
        />
      </section>

      {draft && <ItemDrawer draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
