import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/date-utils";
import type { Item } from "@/lib/types";
import HomePlanner from "@/components/HomePlanner";

export default async function Home() {
  const date = todayISO();
  const supabase = await createClient();

  // Routine-generated items live on the calendar only — the planner is a
  // blank page every day until the user writes something on it.
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("date", date)
    .is("routine_id", null)
    .order("created_at", { ascending: true });

  return <HomePlanner date={date} initialItems={(items as Item[]) ?? []} />;
}
