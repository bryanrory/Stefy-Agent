import { logger } from "../../config/logger";

export const REMINDER_TIMEZONE = process.env.TZ || "America/Sao_Paulo";

const WEEKDAY_MAP: Record<string, number> = {
  domingo: 0, dom: 0, sunday: 0, sun: 0,
  segunda: 1, seg: 1, monday: 1, mon: 1,
  terca: 2, ter: 2, tuesday: 2, tue: 2,
  quarta: 3, qua: 3, wednesday: 3, wed: 3,
  quinta: 4, qui: 4, thursday: 4, thu: 4,
  sexta: 5, sex: 5, friday: 5, fri: 5,
  sabado: 6, sab: 6, saturday: 6, sat: 6,
};

const WEEKDAY_RRULE: Record<number, string> = {
  0: "SU", 1: "MO", 2: "TU", 3: "WE", 4: "TH", 5: "FR", 6: "SA",
};

const WEEKDAY_EN: string[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const ORDINAL_MAP: Record<string, number> = {
  primeiro: 1, primeira: 1, first: 1,
  segundo: 2, segunda: 2, second: 2,
  terceiro: 3, terceira: 3, third: 3,
  quarto: 4, quarta: 4, fourth: 4,
  ultimo: -1, ultima: -1, last: -1,
};

const ORDINAL_POS: Record<number, string> = {
  1: "first", 2: "second", 3: "third", 4: "fourth", [-1]: "last",
};

export interface ParsedReminder {
  datetime: Date | null;
  time: string;
  rrule: string | null;
  repeat_type: string | null;
  repeat_value: string | null;
  repeat_days: string | null;
  repeat_interval: number | null;
  timezone: string;
}

function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function extractTime(text: string): { hours: number; minutes: number } | null {
  let m: RegExpMatchArray | null;

  // "às 13:30" / "as 13:30"
  m = text.match(/(?:as|às)\s+(\d{1,2}):(\d{2})/i);
  if (m) return { hours: parseInt(m[1]), minutes: parseInt(m[2]) };

  // "às 13h30" / "as 13h30"
  m = text.match(/(?:as|às)\s+(\d{1,2})h(\d{2})/i);
  if (m) return { hours: parseInt(m[1]), minutes: parseInt(m[2]) };

  // "às 13h" / "as 13h" / "às 13"
  m = text.match(/(?:as|às)\s+(\d{1,2})(?:h(?:oras?)?)?(?:\s|$)/i);
  if (m) return { hours: parseInt(m[1]), minutes: 0 };

  // "13h30"
  m = text.match(/(\d{1,2})h(\d{2})/i);
  if (m) return { hours: parseInt(m[1]), minutes: parseInt(m[2]) };

  // "13h"
  m = text.match(/(\d{1,2})h(?:\s|$)/i);
  if (m) return { hours: parseInt(m[1]), minutes: 0 };

  // "13:30" (standalone, not part of date like 14/03)
  m = text.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
  if (m) return { hours: parseInt(m[1]), minutes: parseInt(m[2]) };

  return null;
}

function resolveWeekday(name: string): number | null {
  const key = norm(name);
  return WEEKDAY_MAP[key] ?? null;
}

function makeResult(overrides: Partial<ParsedReminder> & { time: string }): ParsedReminder {
  return {
    datetime: null,
    rrule: null,
    repeat_type: null,
    repeat_value: null,
    repeat_days: null,
    repeat_interval: null,
    timezone: REMINDER_TIMEZONE,
    ...overrides,
  };
}

function fmtTime(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseDateInput(text: string): ParsedReminder {
  const input = norm(text.trim());
  const now = new Date();

  // ─── 1. RELATIVE: "daqui X minutos", "em X horas", "in X minutes" ───
  const relMatch = input.match(/^(?:daqui|em|in)\s+(\d+)\s+(segundos?|minutos?|horas?|dias?|seconds?|minutes?|hours?|days?)$/);
  if (relMatch) {
    const amount = parseInt(relMatch[1]);
    const unit = relMatch[2];
    const target = new Date(now);
    if (/^segundo|^second/.test(unit)) target.setSeconds(target.getSeconds() + amount);
    else if (/^minuto|^minute/.test(unit)) target.setMinutes(target.getMinutes() + amount);
    else if (/^hora|^hour/.test(unit)) target.setHours(target.getHours() + amount);
    else if (/^dia|^day/.test(unit)) target.setDate(target.getDate() + amount);
    return makeResult({ datetime: target, time: fmtTime(target.getHours(), target.getMinutes()) });
  }

  // ─── 2. RECURRENCE ───

  // "a cada X dias" / "every X days"
  const intervalMatch = input.match(/(?:a cada|every)\s+(\d+)\s*(?:dias?|days?)/);
  if (intervalMatch) {
    const interval = parseInt(intervalMatch[1]);
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: `FREQ=DAILY;INTERVAL=${interval}`,
      repeat_type: "interval",
      repeat_interval: interval,
    });
  }

  // "primeiro/último [weekday] do mês"
  const monthWdMatch = input.match(/(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa])\s+(domingo|segunda|terca|quarta|quinta|sexta|sabado)\s+do\s+mes/);
  if (monthWdMatch) {
    const posKey = monthWdMatch[1].replace(/[oa]$/, "o");
    const pos = ORDINAL_MAP[posKey] ?? 1;
    const dayIdx = resolveWeekday(monthWdMatch[2]) ?? 0;
    const rrDay = WEEKDAY_RRULE[dayIdx];
    const posName = ORDINAL_POS[pos] || "first";
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: `FREQ=MONTHLY;BYDAY=${rrDay};BYSETPOS=${pos}`,
      repeat_type: "monthly_nth_weekday",
      repeat_value: `${posName}_${WEEKDAY_EN[dayIdx]}`,
    });
  }

  // "último dia do mês"
  if (/ultimo\s+dia\s+do\s+mes/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: "FREQ=MONTHLY;BYMONTHDAY=-1",
      repeat_type: "monthly_last_day",
    });
  }

  // "primeiro dia do mês"
  if (/primeiro\s+dia\s+do\s+mes/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: "FREQ=MONTHLY;BYMONTHDAY=1",
      repeat_type: "monthly_day",
      repeat_value: "1",
    });
  }

  // "todo dia X" / "dia X de cada mês" (monthly)
  const monthlyDayMatch = input.match(/(?:todo\s+)?dia\s+(\d{1,2})\s+(?:de\s+cada\s+mes|do\s+mes)/);
  if (monthlyDayMatch) {
    const day = parseInt(monthlyDayMatch[1]);
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: `FREQ=MONTHLY;BYMONTHDAY=${day}`,
      repeat_type: "monthly_day",
      repeat_value: String(day),
    });
  }

  // "todo dia X" standalone (monthly if number > 0)
  const todoDiaMatch = input.match(/^todo\s+dia\s+(\d{1,2})(?:\s|$)/);
  if (todoDiaMatch) {
    const day = parseInt(todoDiaMatch[1]);
    if (day >= 1 && day <= 31) {
      const t = extractTime(input) || { hours: 9, minutes: 0 };
      return makeResult({
        time: fmtTime(t.hours, t.minutes),
        rrule: `FREQ=MONTHLY;BYMONTHDAY=${day}`,
        repeat_type: "monthly_day",
        repeat_value: String(day),
      });
    }
  }

  // "todo dia útil" / "dias úteis" / "de segunda a sexta" / "dias de semana" (BEFORE "todo dia")
  if (/dia[s]?\s*utei[sl]|dia[s]?\s*uti[sl]|dia[s]?\s*de\s*semana|segunda\s*a\s*sexta/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
      repeat_type: "weekdays",
      repeat_days: "mon,tue,wed,thu,fri",
    });
  }

  // "fim de semana" / "fins de semana"
  if (/fi[nm]\s*de\s*semana|fins\s*de\s*semana/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: "FREQ=WEEKLY;BYDAY=SA,SU",
      repeat_type: "weekly",
      repeat_days: "sat,sun",
    });
  }

  // "todo dia" / "todos os dias" / "diariamente" (DAILY — must come after "todo dia X" and "todo dia útil")
  if (/^(?:todo[s]?\s*(?:os\s*)?dia[s]?|diariamente)/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: "FREQ=DAILY",
      repeat_type: "daily",
    });
  }

  // "toda [weekday]" / "todo [weekday]"
  const weeklyMatch = input.match(/tod[oa]\s+(domingo|segunda|terca|quarta|quinta|sexta|sabado)/);
  if (weeklyMatch) {
    const dayIdx = resolveWeekday(weeklyMatch[1]) ?? 1;
    const rrDay = WEEKDAY_RRULE[dayIdx];
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: `FREQ=WEEKLY;BYDAY=${rrDay}`,
      repeat_type: "weekly",
      repeat_value: WEEKDAY_EN[dayIdx],
    });
  }

  // Yearly: "todo 25/12" / "todo ano dia 1/1"
  const yearlyMatch = input.match(/todo\s*(?:ano\s*)?(?:dia\s*)?(\d{1,2})[\/\-](\d{1,2})/);
  if (yearlyMatch) {
    const day = parseInt(yearlyMatch[1]);
    const month = parseInt(yearlyMatch[2]);
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    return makeResult({
      time: fmtTime(t.hours, t.minutes),
      rrule: `FREQ=YEARLY;BYMONTH=${month};BYMONTHDAY=${day}`,
      repeat_type: "yearly",
      repeat_value: `${day}/${month}`,
    });
  }

  // ─── 3. ONE-TIME WITH DATE ───

  // "depois de amanhã" (before "amanhã")
  if (/depois\s*de\s*amanha/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    const target = new Date(now);
    target.setDate(target.getDate() + 2);
    target.setHours(t.hours, t.minutes, 0, 0);
    return makeResult({ datetime: target, time: fmtTime(t.hours, t.minutes) });
  }

  // "amanhã"
  if (/amanha/.test(input)) {
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    target.setHours(t.hours, t.minutes, 0, 0);
    return makeResult({ datetime: target, time: fmtTime(t.hours, t.minutes) });
  }

  // "hoje"
  if (/hoje/.test(input)) {
    const t = extractTime(input);
    if (!t) throw new Error("PARSE_ERROR");
    const target = new Date(now);
    target.setHours(t.hours, t.minutes, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return makeResult({ datetime: target, time: fmtTime(t.hours, t.minutes) });
  }

  // Next weekday: "segunda às 8" (without "toda")
  const weekdayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  for (const name of weekdayNames) {
    const pattern = new RegExp(`(?:^|\\s)${name}(?:\\s|$)`);
    if (pattern.test(input) && !/tod[oa]/.test(input) && !/do\s+mes/.test(input)) {
      const dayIdx = resolveWeekday(name)!;
      const t = extractTime(input) || { hours: 9, minutes: 0 };
      const target = new Date(now);
      let daysUntil = dayIdx - target.getDay();
      if (daysUntil <= 0) daysUntil += 7;
      target.setDate(target.getDate() + daysUntil);
      target.setHours(t.hours, t.minutes, 0, 0);
      return makeResult({ datetime: target, time: fmtTime(t.hours, t.minutes) });
    }
  }

  // ISO date: "2026-03-14"
  const isoMatch = input.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1;
    const day = parseInt(isoMatch[3]);
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    const target = new Date(year, month, day, t.hours, t.minutes, 0, 0);
    return makeResult({ datetime: target, time: fmtTime(t.hours, t.minutes) });
  }

  // DD/MM or DD/MM/YYYY
  const dateBrMatch = input.match(/(\d{1,2})[\/](\d{1,2})(?:[\/](\d{4}))?/);
  if (dateBrMatch) {
    const day = parseInt(dateBrMatch[1]);
    const month = parseInt(dateBrMatch[2]) - 1;
    const year = dateBrMatch[3] ? parseInt(dateBrMatch[3]) : now.getFullYear();
    const t = extractTime(input) || { hours: 9, minutes: 0 };
    const target = new Date(year, month, day, t.hours, t.minutes, 0, 0);
    if (target <= now && !dateBrMatch[3]) target.setFullYear(target.getFullYear() + 1);
    return makeResult({ datetime: target, time: fmtTime(t.hours, t.minutes) });
  }

  // Plain HH:mm — assume today (or tomorrow if passed)
  const plainHm = input.match(/^(\d{1,2}):(\d{2})$/);
  if (plainHm) {
    const h = parseInt(plainHm[1]);
    const m = parseInt(plainHm[2]);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return makeResult({ datetime: target, time: fmtTime(h, m) });
  }

  // Plain Xh or XhMM
  const plainH = input.match(/^(\d{1,2})h(\d{2})?$/);
  if (plainH) {
    const h = parseInt(plainH[1]);
    const m = plainH[2] ? parseInt(plainH[2]) : 0;
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    return makeResult({ datetime: target, time: fmtTime(h, m) });
  }

  throw new Error("PARSE_ERROR");
}

export function safeParseDateInput(text: string): ParsedReminder | null {
  try {
    const result = parseDateInput(text);
    logger.info({ input: text, result: { ...result, datetime: result.datetime?.toISOString() } }, "Date parsed");
    return result;
  } catch (err) {
    logger.warn({ input: text, err }, "Date parse failed");
    return null;
  }
}

export const PARSE_ERROR_MESSAGE = `Não consegui entender a data. Tente algo como:
- hoje às 14:00
- amanhã às 9
- daqui 10 minutos
- segunda às 8
- 14/03 às 10:00
- todo dia às 8
- toda segunda
- todo dia útil`;
