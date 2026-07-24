"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Item } from "@/lib/types";
import { updateItem } from "@/app/plan/actions";
import { addDays, todayISO } from "@/lib/date-utils";
import { START_HOUR, PX_PER_MIN } from "@/lib/grid-constants";
import WeekGrid from "@/components/WeekGrid";
import ItemDrawer, { type ItemDraft } from "@/components/ItemDrawer";

export default function WeekPlanner({
  weekStart,
  initialItems,
}: {
  weekStart: string;
  initialItems: Item[]; // scheduled items across the week
}) {
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [, startTransition] = useTransition();
  const scrollRef = useRef<HTMLElement>(null);

  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  useEffect(() => {
    const today = todayISO();
    const weekEnd = addDays(weekStart, 6);
    if (today < weekStart || today > weekEnd || !scrollRef.current) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const top = (nowMinutes - START_HOUR * 60) * PX_PER_MIN;
    scrollRef.current.scrollTop = Math.max(top - 160, 0);
  }, [weekStart]);

  function blankDraft(date: string, startTime: string, durationMinutes: number): ItemDraft {
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
      date: item.date,
      title: item.title,
      notes: item.notes ?? "",
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      completed: item.completed,
      routineId: item.routine_id,
    };
  }

  function reschedule(itemId: string, date: string, startTime: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, date, start_time: startTime } : i)),
    );
    startTransition(async () => {
      await updateItem(itemId, { date, startTime });
    });
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <section
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-auto bg-white p-3 dark:bg-neutral-900"
      >
        <WeekGrid
          weekStart={weekStart}
          items={items}
          onDropItem={reschedule}
          onCreateRange={(date, startTime, durationMinutes) =>
            setDraft(blankDraft(date, startTime, durationMinutes))
          }
          onBlockClick={(item) => setDraft(editDraft(item))}
        />
      </section>

      {draft && <ItemDrawer draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
