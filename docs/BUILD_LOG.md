# BUILD LOG

**Date:** 2026-07-27

---

## Focus Today
*(none carried in — this is the first build log for the project)*

---

## Milestones Completed (high-level only; keep section short and sweet)
- Supabase-backed auth (login/signup/logout) with route-level session middleware
- Day planner: drag-and-drop backlog + time-blocking grid, live current-time indicator, click-and-drag event creation
- Recurring routines that auto-materialize into each day (`ensureRoutinesMaterialized`)
- Week view alongside the day view, sharing the same grid components
- Blank-canvas "Planner" home page (`/`) separate from the "Calendar" (`/plan`) — a daily scratch pad for jotting tasks, decoupled from time-blocking. Routine-generated items are excluded so it's empty every new day until the user writes on it
- Unified `Planner / Calendar / Routines` tab navigation (`NavTabs`) across all three top-level pages
- Inline complete/incomplete toggle (checkbox) on calendar blocks and backlog items, without opening the edit drawer
- Grid rework: `DayColumn`/`TimeGrid`/`WeekGrid` consolidated into a single `DaysGrid`, with click-to-select vs. double-click-to-edit blocks and drag-to-resize on block edges

---

## What We Accomplished Today
Built the Planner/Calendar split: new `HomePlanner` component and `/` route, backlog items shared between the two pages via the same `items` table, routine-generated items filtered out of the Planner query so it's blank every new day. Added an inline done/not-done checkbox to calendar blocks and backlog items so tasks can be toggled without opening the edit drawer. Added the shared `NavTabs` component (`Planner / Calendar / Routines`) and wired it into `HomePlanner`, `DateNav`, and the routines page, replacing the old ad-hoc links. Updated post-login/signup redirects and the auth callback default to land on `/` instead of `/plan`.

Also reworked the day/week grid into a single `DaysGrid.tsx` (replacing `TimeGrid.tsx`/`WeekGrid.tsx`), with click-to-select (ring highlight) vs. double-click-to-edit on blocks, and drag-to-resize from a block's top/bottom edge. `DayPlanner` now shows two days (today + tomorrow) side by side.

None of today's work is committed yet — everything above is in the working tree.

---

## Tomorrow
*(evening session)*

---

## Backlog
*(empty — add items here as they come up)*
