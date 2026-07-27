import { createClient } from "@/lib/supabase/server";
import { ensureRoutinesMaterialized } from "@/lib/routines";
import { addDays, startOfWeek, todayISO } from "@/lib/date-utils";
import type { Item } from "@/lib/types";
import DateNav from "@/components/DateNav";
import DayPlanner from "@/components/DayPlanner";
import WeekPlanner from "@/components/WeekPlanner";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const { date: dateParam, view: viewParam } = await searchParams;
  const date = dateParam ?? todayISO();
  const view = viewParam === "week" ? "week" : "day";

  const supabase = await createClient();

  if (view === "week") {
    const weekStart = startOfWeek(date);
    const weekEnd = addDays(weekStart, 6);
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    await Promise.all(weekDates.map((d) => ensureRoutinesMaterialized(d)));

    const { data: items } = await supabase
      .from("items")
      .select("*")
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .not("start_time", "is", null)
      .order("start_time", { ascending: true });

    return (
      <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
        <DateNav date={date} view={view} />
        <WeekPlanner weekStart={weekStart} initialItems={(items as Item[]) ?? []} />
      </div>
    );
  }

  const nextDate = addDays(date, 1);
  await Promise.all([
    ensureRoutinesMaterialized(date),
    ensureRoutinesMaterialized(nextDate),
  ]);

  const { data: items } = await supabase
    .from("items")
    .select("*")
    .gte("date", date)
    .lte("date", nextDate)
    .order("start_time", { ascending: true, nullsFirst: true });

  return (
    <div className="flex h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <DateNav date={date} view={view} />
      <DayPlanner date={date} initialItems={(items as Item[]) ?? []} />
    </div>
  );
}
