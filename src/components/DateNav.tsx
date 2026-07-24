import Link from "next/link";
import { addDays, formatDisplayDate, startOfWeek, formatShortDate, todayISO } from "@/lib/date-utils";
import LogoutButton from "@/components/LogoutButton";

export default function DateNav({
  date,
  view,
}: {
  date: string;
  view: "day" | "week";
}) {
  const isToday = date === todayISO();
  const step = view === "week" ? 7 : 1;
  const prevHref = `/plan?view=${view}&date=${addDays(date, -step)}`;
  const nextHref = `/plan?view=${view}&date=${addDays(date, step)}`;
  const todayHref = view === "week" ? "/plan?view=week" : "/plan";

  const label =
    view === "week"
      ? `${formatShortDate(startOfWeek(date))} – ${formatShortDate(addDays(startOfWeek(date), 6))}`
      : formatDisplayDate(date);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/plan"
          className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          Blockly
        </Link>
        <span className="hidden text-sm text-neutral-400 sm:inline">/</span>
        <h1 className="hidden text-sm font-medium text-neutral-600 dark:text-neutral-400 sm:inline">
          {label}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          aria-label={view === "week" ? "Previous week" : "Previous day"}
        >
          ←
        </Link>
        <Link
          href={todayHref}
          className={`rounded-md border px-2.5 py-1.5 text-sm transition ${
            isToday
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          }`}
        >
          Today
        </Link>
        <Link
          href={nextHref}
          className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          aria-label={view === "week" ? "Next week" : "Next day"}
        >
          →
        </Link>

        <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

        <div className="flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-800">
          <Link
            href={`/plan?date=${date}`}
            className={`rounded px-2.5 py-1 text-sm transition ${
              view === "day"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Day
          </Link>
          <Link
            href={`/plan?view=week&date=${date}`}
            className={`rounded px-2.5 py-1 text-sm transition ${
              view === "week"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Week
          </Link>
        </div>

        <span className="mx-1 h-5 w-px bg-neutral-200 dark:bg-neutral-800" />

        <Link
          href="/routines"
          className="rounded-md px-2.5 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Routines
        </Link>
        <LogoutButton />
      </div>

      <h1 className="w-full text-sm font-medium text-neutral-600 dark:text-neutral-400 sm:hidden">
        {label}
      </h1>
    </header>
  );
}
