import { CHURCH_TIME_ZONE } from "./format";

/**
 * The current date and time in the church's time zone (Africa/Lagos), as
 * "YYYY-MM-DD" and "HH:mm" — the same formats editors use in the Studio.
 */
export function churchNow(now: Date = new Date(), timeZone: string = CHURCH_TIME_ZONE) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}
