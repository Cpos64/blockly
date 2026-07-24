export const START_HOUR = 5;
export const END_HOUR = 24; // exclusive end (midnight)
export const SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 32; // px per 30-minute slot
export const PX_PER_MIN = SLOT_HEIGHT / SLOT_MINUTES;
export const SNAP_MINUTES = 15; // finest resolution when dragging to create
export const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * 60 * PX_PER_MIN;

export function hourLabel(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${period}`;
}

export function buildSlots(): number[] {
  const slots: number[] = [];
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += SLOT_MINUTES) {
    slots.push(m);
  }
  return slots;
}
