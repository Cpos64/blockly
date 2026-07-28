"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Item } from "@/lib/types";
import { addItem, updateItem, deleteItem } from "@/app/plan/actions";
import { formatTime, formatDisplayDate } from "@/lib/date-utils";
import ItemDrawer, { type ItemDraft } from "@/components/ItemDrawer";
import LogoutButton from "@/components/LogoutButton";
import NavTabs from "@/components/NavTabs";

export default function HomePlanner({
  date,
  initialItems,
}: {
  date: string;
  initialItems: Item[];
}) {
  const [prevInitialItems, setPrevInitialItems] = useState(initialItems);
  const [items, setItems] = useState(initialItems);
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync local state when the server gives us a fresh items list, without
  // the cascading-render effect antipattern.
  if (initialItems !== prevInitialItems) {
    setPrevInitialItems(initialItems);
    setItems(initialItems);
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const title = text.trim();
    if (!title) return;
    setText("");
    startTransition(async () => {
      await addItem({ date, title, startTime: null, durationMinutes: 30 });
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

  function remove(item: Item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      await deleteItem(item.id);
    });
  }

  // Timed tasks sort soonest-first; untimed tasks keep their creation order
  // and sit below the timed ones.
  const sortedItems = [...items].sort((a, b) => {
    if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
    if (a.start_time) return -1;
    if (b.start_time) return 1;
    return 0;
  });

  function editDraft(item: Item, origin?: { x: number; y: number }): ItemDraft {
    return {
      id: item.id,
      date,
      title: item.title,
      notes: item.notes ?? "",
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      completed: item.completed,
      routineId: item.routine_id,
      origin,
    };
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          Blockly
        </Link>
        <div className="flex items-center gap-3">
          <NavTabs active="planner" />
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-500">
          Today
        </p>
        <h1 className="mt-1 font-serif text-3xl text-neutral-900 sm:text-4xl dark:text-neutral-50">
          {formatDisplayDate(date)}
        </h1>

        <form
          onSubmit={handleAdd}
          className="mt-10 border-b border-neutral-300 pb-3 dark:border-neutral-700"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you need to get done today?"
            autoFocus
            className="w-full bg-transparent text-lg text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600"
          />
        </form>

        <ul className="flex-1">
          {items.length === 0 && (
            <li className="py-14 text-center text-sm text-neutral-400 dark:text-neutral-600">
              A blank page. Write down what today needs.
            </li>
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            {sortedItems.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="group flex items-center gap-3 border-b border-dotted border-neutral-200 py-3 dark:border-neutral-800"
              >
                <button
                  type="button"
                  onClick={() => toggleComplete(item)}
                  aria-label={item.completed ? "Mark incomplete" : "Mark done"}
                  style={{
                    borderColor: item.color,
                    backgroundColor: item.completed ? item.color : "transparent",
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition"
                >
                  {item.completed && (
                    <span className="text-[10px] leading-none text-white">
                      ✓
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => setDraft(editDraft(item, { x: e.clientX, y: e.clientY }))}
                  className={`flex-1 truncate text-left text-base text-neutral-800 dark:text-neutral-100 ${
                    item.completed
                      ? "text-neutral-400 line-through dark:text-neutral-600"
                      : ""
                  }`}
                >
                  {item.title}
                </button>
                {item.start_time && (
                  <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-600">
                    {formatTime(item.start_time)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(item)}
                  aria-label="Delete"
                  className="shrink-0 text-neutral-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 dark:text-neutral-700"
                >
                  ✕
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <Link
          href="/plan"
          className="mt-10 inline-flex w-fit items-center gap-2 self-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
        >
          Block out time on the calendar →
        </Link>
      </main>

      {draft && <ItemDrawer draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
