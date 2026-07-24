import { createClient } from "@/lib/supabase/server";
import { dayOfWeek } from "@/lib/date-utils";

// Called when a day is opened in the planner. Creates an `items` row for
// every active routine scheduled on that day of week, unless one has
// already been materialized for this date (tracked via items.routine_id).
export async function ensureRoutinesMaterialized(date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dow = dayOfWeek(date);

  const { data: routines } = await supabase
    .from("routines")
    .select("*")
    .eq("active", true)
    .contains("days_of_week", [dow]);

  if (!routines || routines.length === 0) return;

  const { data: existing } = await supabase
    .from("items")
    .select("routine_id")
    .eq("date", date)
    .not("routine_id", "is", null);

  const existingIds = new Set((existing ?? []).map((i) => i.routine_id));
  const missing = routines.filter((r) => !existingIds.has(r.id));
  if (missing.length === 0) return;

  const rows = missing.map((r) => ({
    user_id: user.id,
    routine_id: r.id,
    date,
    title: r.title,
    notes: r.notes,
    start_time: r.start_time,
    duration_minutes: r.duration_minutes,
    color: r.color,
  }));

  await supabase.from("items").insert(rows);
}
