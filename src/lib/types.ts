export type Item = {
  id: string;
  user_id: string;
  routine_id: string | null;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string | null;
  start_time: string | null; // "HH:MM:SS", null = unscheduled backlog item
  duration_minutes: number;
  completed: boolean;
  color: string;
  created_at: string;
};

export type Routine = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  duration_minutes: number;
  start_time: string | null;
  days_of_week: number[]; // 0=Sun .. 6=Sat
  color: string;
  active: boolean;
  created_at: string;
};

export const PALETTE = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#64748b", // slate
];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
