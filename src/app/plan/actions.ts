"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PALETTE } from "@/lib/types";

export async function addItem(input: {
  date: string;
  title: string;
  startTime: string | null;
  durationMinutes: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];

  const { error } = await supabase.from("items").insert({
    user_id: user.id,
    date: input.date,
    title: input.title,
    start_time: input.startTime,
    duration_minutes: input.durationMinutes,
    color,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/plan");
}

export async function updateItem(
  id: string,
  patch: Partial<{
    title: string;
    notes: string | null;
    date: string;
    startTime: string | null;
    durationMinutes: number;
    completed: boolean;
  }>,
) {
  const supabase = await createClient();
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.notes !== undefined) dbPatch.notes = patch.notes;
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.startTime !== undefined) dbPatch.start_time = patch.startTime;
  if (patch.durationMinutes !== undefined)
    dbPatch.duration_minutes = patch.durationMinutes;
  if (patch.completed !== undefined) dbPatch.completed = patch.completed;

  const { error } = await supabase.from("items").update(dbPatch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/plan");
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/plan");
}
