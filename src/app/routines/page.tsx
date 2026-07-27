import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Routine } from "@/lib/types";
import RoutineManager from "@/components/RoutineManager";
import LogoutButton from "@/components/LogoutButton";
import NavTabs from "@/components/NavTabs";

export default async function RoutinesPage() {
  const supabase = await createClient();
  const { data: routines } = await supabase
    .from("routines")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            Blockly
          </Link>
          <span className="text-sm text-neutral-400">/</span>
          <h1 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Routines
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <NavTabs active="routines" />
          <LogoutButton />
        </div>
      </header>

      <RoutineManager initialRoutines={(routines as Routine[]) ?? []} />
    </div>
  );
}
