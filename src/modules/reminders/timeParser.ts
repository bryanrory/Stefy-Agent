const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const RELATIVE_REGEX = /^in\s+(\d+)\s+(seconds?|minutes?|hours?)$/i;

export interface ParsedTime {
  datetime: Date;
  original: string;
}

export function parseTimeInput(text: string): ParsedTime {
  const trimmed = text.trim();

  // HH:mm format — schedule for today (or tomorrow if time already passed)
  if (HH_MM_REGEX.test(trimmed)) {
    const [hours, minutes] = trimmed.split(":").map(Number);
    const now = new Date();
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return { datetime: target, original: trimmed };
  }

  // Relative format: "in X minutes/hours/seconds"
  const match = trimmed.match(RELATIVE_REGEX);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const now = new Date();

    if (unit.startsWith("second")) {
      now.setSeconds(now.getSeconds() + amount);
    } else if (unit.startsWith("minute")) {
      now.setMinutes(now.getMinutes() + amount);
    } else if (unit.startsWith("hour")) {
      now.setHours(now.getHours() + amount);
    }

    return { datetime: now, original: trimmed };
  }

  throw new Error(
    `Invalid time format: "${trimmed}". Use HH:mm (e.g. 08:30) or relative (e.g. "in 5 minutes")`
  );
}
