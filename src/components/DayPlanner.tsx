"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Item } from "@/lib/types";
import { updateItem } from "@/app/plan/actions";
import { formatTime, todayISO } from "@/lib/date-utils";
import { START_HOUR, PX_PER_MIN } from "@/lib/grid-constants";
import TimeGrid from "@/components/TimeGrid";
import ItemDrawer, { type ItemDraft } from "@/components/ItemDrawer";

export default function DayPlanner({
  date,
  initialItems,
}: {
  date: string;
  initialItems: Item[];
}) {
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
    if (date !== todayISO() || !scrollRef.current) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const top = (nowMinutes - START_HOUR * 60) * PX_PER_MIN;
    scrollRef.current.scrollTop = Math.max(top - 160, 0);
  }, [date]);

  const backlog = items.filter((i) => !i.start_time);
  const scheduled = items.filter((i) => i.start_time);

  function blankDraft(startTime: string | null, durationMinutes = 30): ItemDraft {
    return {
      date,
      title: "",
      notes: "",
      startTime,
      durationMinutes,
      completed: false,
    };
  }

  function editDraft(item: Item): ItemDraft {
    return {
      id: item.id,
      date,
      title: item.title,
      notes: item.notes ?? "",
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      completed: item.completed,
      routineId: item.routine_id,
    };
  }

  function reschedule(itemId: string, startTime: string | null) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, start_time: startTime } : i)),
    );
    startTransition(async () => {
      await updateItem(itemId, { startTime });
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="flex w-full max-w-xs shrink-0 flex-col gap-3 overflow-y-auto border-r border-neutral-200 p-4 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Backlog
          </h2>
          <button
            onClick={() => setDraft(blankDraft(null))}
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
            if (itemId) reschedule(itemId, null);
          }}
          className="flex min-h-[80px] flex-col gap-2 rounded-lg border border-dashed border-neutral-300 p-2 dark:border-neutral-700"
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
              onClick={() => setDraft(editDraft(item))}
              style={{ borderColor: item.color }}
              className={`cursor-grab rounded-md border-l-4 bg-white px-3 py-2 text-sm shadow-sm transition active:cursor-grabbing dark:bg-neutral-900 ${
                item.completed ? "opacity-50" : ""
              }`}
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
            </div>
          ))}
        </div>

        {scheduled.length > 0 && (
          <div className="mt-2">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
              Today at a glance
            </h3>
            <ul className="space-y-1 text-xs text-neutral-500">
              {scheduled.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">{i.title}</span>
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
        <TimeGrid
          date={date}
          items={scheduled}
          onDropItem={(itemId, _date, startTime) => reschedule(itemId, startTime)}
          onCreateRange={(_date, startTime, durationMinutes) =>
            setDraft(blankDraft(startTime, durationMinutes))
          }
          onBlockClick={(item) => setDraft(editDraft(item))}
        />
      </section>

      {draft && <ItemDrawer draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
