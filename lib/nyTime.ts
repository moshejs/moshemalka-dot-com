export type Time = { h: number; m: number; s: number };

/** The wall-clock time in New York right now; h is 0–11, s is fractional. */
export function nyTime(): Time {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { h: get("hour") % 12, m: get("minute"), s: get("second") + (Date.now() % 1000) / 1000 };
}

/** Hand angles in clockwise degrees from twelve. */
export function handAngles(t: Time): { hour: number; minute: number; second: number } {
  return {
    hour: (t.h + t.m / 60) * 30,
    minute: (t.m + t.s / 60) * 6,
    second: t.s * 6,
  };
}
