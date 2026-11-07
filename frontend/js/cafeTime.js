// Opening hours and pickup slots in the café's own time zone, whatever time zone the visitor's
// device uses. Change CAFE_TIME_ZONE (an IANA name such as 'Asia/Karachi') if the café moves.

export const CAFE_TIME_ZONE = 'UTC';
export const CAFE_TIME_ZONE_LABEL = 'UTC';
export const OPEN_HOUR = 6;
export const CLOSE_HOUR = 24; // midnight
export const OPEN_LABEL = '6:00 AM';
export const HOURS_LABEL = '6:00 AM to midnight';
export const MIN_LEAD_MINUTES = 15;
export const SLOT_MINUTES = 15;

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CAFE_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

// The café's wall-clock date and time at a given moment, e.g. { year: 2026, month: 11, day: 7, hour: 21, ... }.
function cafeParts(date) {
  return Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

// The moment when the café's clock shows the given date and time.
function cafeMoment(year, month, day, minutesAfterMidnight) {
  const asIfUtc = Date.UTC(year, month - 1, day, 0, minutesAfterMidnight);
  const p = cafeParts(new Date(asIfUtc));
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - asIfUtc;
  return new Date(asIfUtc - offset);
}

// Today's pickup times (today in the café): every SLOT_MINUTES from opening until the last slot
// before closing, skipping any that are less than MIN_LEAD_MINUTES away.
export function todaysPickupSlots(now = new Date()) {
  const { year, month, day } = cafeParts(now);
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60 * 1000;
  const slots = [];
  for (let minutes = OPEN_HOUR * 60; minutes <= CLOSE_HOUR * 60 - SLOT_MINUTES; minutes += SLOT_MINUTES) {
    const slot = cafeMoment(year, month, day, minutes);
    if (slot.getTime() >= earliest) slots.push(slot);
  }
  return slots;
}

// Formats a moment as the café's local time, e.g. "2:30 PM".
export const formatCafeTime = (date) =>
  date.toLocaleTimeString(undefined, { timeZone: CAFE_TIME_ZONE, hour: 'numeric', minute: '2-digit' });
