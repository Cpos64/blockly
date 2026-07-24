"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PALETTE } from "@/lib/types";

export type RoutineInput = {
  title: string;
  daysOfWeek: number[];
  startTime: string | null; // "HH:MM:00" or null
  durationMinutes: number;
};

export async function addRoutine(input: RoutineInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

  const { error } = await supabase.from("routines").insert({
    user_id: user.id,
    title: input.title,
    days_of_week: input.daysOfWeek,
    start_time: input.startTime,
    duration_minutes: input.durationMinutes,
    color,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/routines");
}

export async function updateRoutine(
  id: string,
  patch: Partial<{
    title: string;
    daysOfWeek: number[];
    startTime: string | null;
    durationMinutes: number;
    active: boolean;
  }>,
) {
  const supabase = await createClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.daysOfWeek !== undefined) dbPatch.days_of_week = patch.daysOfWeek;
  if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime;
  if (patch.durationMinutes !== undefined)
    dbPatch.duration_minutes = patch.durationMinutes;
  if (patch.active !== undefined) dbPatch.active = patch.active;

  const { error } = await supabase
    .from("routines")
    .update(dbPatch)
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/routines");
}

export async function deleteRoutine(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/routines");
}
