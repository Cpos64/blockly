"use client";

import { useState, useTransition } from "react";
import type { Routine } from "@/lib/types";
import { DAY_LABELS } from "@/lib/types";
import { addRoutine, updateRoutine, deleteRoutine } from "@/app/routines/actions";
import { formatTime, minutesToTime, timeToMinutes } from "@/lib/date-utils";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS = [1, 2, 3, 4, 5];

export default function RoutineManager({
  initialRoutines,
}: {
  initialRoutines: Routine[];
}) {
  const [prevInitialRoutines, setPrevInitialRoutines] = useState(initialRoutines);
  const [routines, setRoutines] = useState(initialRoutines);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<Set<number>>(new Set(ALL_DAYS));
  const [scheduled, setScheduled] = useState(false);
  const [time, setTime] = useState("07:00");
  const [duration, setDuration] = useState(30);
  const [pending, startTransition] = useTransition();

  // Re-sync local state when the server gives us a fresh routines list
  // (e.g. after a revalidation from add/update/delete).
  if (initialRoutines !== prevInitialRoutines) {
    setPrevInitialRoutines(initialRoutines);
    setRoutines(initialRoutines);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDays(new Set(ALL_DAYS));
    setScheduled(false);
    setTime("07:00");
    setDuration(30);
  }

  function loadForEdit(r: Routine) {
    setEditingId(r.id);
    setTitle(r.title);
    setDays(new Set(r.days_of_week));
    setScheduled(r.start_time !== null);
    setTime(r.start_time ? r.start_time.slice(0, 5) : "07:00");
    setDuration(r.duration_minutes);
  }

  function toggleDay(d: number) {
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function handleSubmit() {
    if (!title.trim() || days.size === 0) return;
    const input = {
      title: title.trim(),
      daysOfWeek: Array.from(days).sort(),
      startTime: scheduled ? minutesToTime(timeToMinutes(time)) : null,
      durationMinutes: duration,
    };

    startTransition(async () => {
      if (editingId) {
        await updateRoutine(editingId, input);
      } else {
        await addRoutine(input);
      }
      resetForm();
    });
  }

  function handleDelete(id: string) {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => {
      await deleteRoutine(id);
    });
    if (editingId === id) resetForm();
  }

  function handleToggleActive(r: Routine) {
    setRoutines((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)),
    );
    startTransition(async () => {
      await updateRoutine(r.id, { active: !r.active });
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          {editingId ? "Edit routine" : "New routine"}
        </h2>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gym, Standup, Read"
              className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Repeats on
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`h-8 w-11 rounded-md border text-xs font-medium transition ${
                    days.has(d)
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDays(new Set(ALL_DAYS))}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Every day
              </button>
              <button
                type="button"
                onClick={() => setDays(new Set(WEEKDAYS))}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Weekdays
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="routine-scheduled"
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <label htmlFor="routine-scheduled" className="text-sm text-neutral-700 dark:text-neutral-300">
              Block a specific time each day (otherwise it lands in the backlog)
            </label>
          </div>

          {scheduled && (
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Start time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
                />
              </div>
              <div className="w-32 space-y-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
                >
                  {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                    <option key={m} value={m}>
                      {m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={pending || !title.trim() || days.size === 0}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {editingId ? "Save changes" : "Add routine"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          Your routines
        </h2>
        {routines.length === 0 && (
          <p className="text-sm text-neutral-400">
            No routines yet. Recurring tasks you add here will automatically
            appear on the right days in your daily plan.
          </p>
        )}
        {routines.map((r) => (
          <div
            key={r.id}
            style={{ borderLeftColor: r.color }}
            className={`flex items-center justify-between gap-3 rounded-lg border border-l-4 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 ${
              !r.active ? "opacity-50" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                {r.title}
              </div>
              <div className="text-xs text-neutral-400">
                {r.days_of_week.length === 7
                  ? "Every day"
                  : r.days_of_week.map((d) => DAY_LABELS[d]).join(", ")}
                {" · "}
                {r.start_time
                  ? `${formatTime(r.start_time)} (${r.duration_minutes}m)`
                  : "Backlog"}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => handleToggleActive(r)}
                className="text-xs text-neutral-500 hover:underline"
              >
                {r.active ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => loadForEdit(r)}
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
