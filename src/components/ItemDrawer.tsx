"use client";

import { useState, useTransition } from "react";
import { addItem, updateItem, deleteItem } from "@/app/plan/actions";
import { timeToMinutes, minutesToTime } from "@/lib/date-utils";

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

function formatDuration(m: number): string {
  if (m < 60) return `${m} min`;
  const hrs = m / 60;
  return Number.isInteger(hrs) ? `${hrs} hr${hrs > 1 ? "s" : ""}` : `${m} min`;
}

export type ItemDraft = {
  id?: string;
  date: string;
  title: string;
  notes: string;
  startTime: string | null; // "HH:MM:00" or null
  durationMinutes: number;
  completed: boolean;
  routineId?: string | null;
};

export default function ItemDrawer({
  draft,
  onClose,
}: {
  draft: ItemDraft;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(draft.title);
  const [notes, setNotes] = useState(draft.notes);
  const [scheduled, setScheduled] = useState(draft.startTime !== null);
  const [time, setTime] = useState(
    draft.startTime ? draft.startTime.slice(0, 5) : "09:00",
  );
  const [duration, setDuration] = useState(draft.durationMinutes);
  const [pending, startTransition] = useTransition();

  const isNew = !draft.id;

  function handleSave() {
    if (!title.trim()) return;
    const startTime = scheduled ? minutesToTime(timeToMinutes(time)) : null;

    startTransition(async () => {
      if (isNew) {
        await addItem({
          date: draft.date,
          title: title.trim(),
          startTime,
          durationMinutes: duration,
        });
      } else {
        await updateItem(draft.id!, {
          title: title.trim(),
          notes: notes || null,
          startTime,
          durationMinutes: duration,
        });
      }
      onClose();
    });
  }

  function handleDelete() {
    if (!draft.id) return;
    startTransition(async () => {
      await deleteItem(draft.id!);
      onClose();
    });
  }

  function handleToggleComplete() {
    if (!draft.id) return;
    startTransition(async () => {
      await updateItem(draft.id!, { completed: !draft.completed });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/20"
      />
      <div className="relative z-10 flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto border-l border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            {isNew ? "New task" : "Edit task"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {draft.routineId && (
          <p className="rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            Generated from a routine. Editing only affects today.
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Title
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
            placeholder="What do you want to do?"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="scheduled"
            type="checkbox"
            checked={scheduled}
            onChange={(e) => setScheduled(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <label htmlFor="scheduled" className="text-sm text-neutral-700 dark:text-neutral-300">
            Block time on the calendar
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
                {DURATION_OPTIONS.includes(duration) ? null : (
                  <option value={duration}>{formatDuration(duration)}</option>
                )}
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {formatDuration(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!isNew && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
            />
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {!isNew ? (
            <button
              onClick={handleDelete}
              disabled={pending}
              className="text-sm text-red-600 hover:underline disabled:opacity-60 dark:text-red-400"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {!isNew && (
              <button
                onClick={handleToggleComplete}
                disabled={pending}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                {draft.completed ? "Mark incomplete" : "Mark done"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={pending || !title.trim()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
