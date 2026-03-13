import { describe, test, expect, vi } from "vitest";

vi.mock("../../config/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: () => ({ info: vi.fn(), warn: vi.fn() }) },
}));

import { parseDateInput, safeParseDateInput, PARSE_ERROR_MESSAGE } from "./dateParser";

function expectParsed(input: string, expected: Partial<ReturnType<typeof parseDateInput>>) {
  const result = parseDateInput(input);
  for (const [key, value] of Object.entries(expected)) {
    if (key === "datetime") {
      if (value === null) {
        expect(result.datetime).toBeNull();
      } else {
        expect(result.datetime).not.toBeNull();
      }
    } else {
      expect((result as any)[key]).toEqual(value);
    }
  }
  return result;
}

describe("dateParser", () => {
  describe("relative time", () => {
    test("daqui 10 minutos", () => {
      const r = parseDateInput("daqui 10 minutos");
      expect(r.datetime).not.toBeNull();
      expect(r.repeat_type).toBeNull();
    });

    test("em 1 hora", () => {
      const r = parseDateInput("em 1 hora");
      expect(r.datetime).not.toBeNull();
      expect(r.repeat_type).toBeNull();
    });

    test("in 5 minutes", () => {
      const r = parseDateInput("in 5 minutes");
      expect(r.datetime).not.toBeNull();
    });

    test("daqui 30 segundos", () => {
      const r = parseDateInput("daqui 30 segundos");
      expect(r.datetime).not.toBeNull();
    });

    test("em 2 dias", () => {
      const r = parseDateInput("em 2 dias");
      expect(r.datetime).not.toBeNull();
    });
  });

  describe("recurrence - daily", () => {
    test("todo dia às 8:00", () => {
      expectParsed("todo dia às 8:00", {
        repeat_type: "daily",
        time: "08:00",
        rrule: "FREQ=DAILY",
        datetime: null,
      });
    });

    test("todos os dias às 22:00", () => {
      expectParsed("todos os dias às 22:00", {
        repeat_type: "daily",
        time: "22:00",
      });
    });

    test("diariamente", () => {
      expectParsed("diariamente", {
        repeat_type: "daily",
        time: "09:00",
      });
    });
  });

  describe("recurrence - weekly", () => {
    test("toda segunda às 8", () => {
      expectParsed("toda segunda às 8", {
        repeat_type: "weekly",
        repeat_value: "monday",
        time: "08:00",
      });
    });

    test("todo domingo às 10:30", () => {
      expectParsed("todo domingo às 10:30", {
        repeat_type: "weekly",
        repeat_value: "sunday",
        time: "10:30",
      });
    });
  });

  describe("recurrence - weekdays", () => {
    test("todo dia útil às 7", () => {
      expectParsed("todo dia útil às 7", {
        repeat_type: "weekdays",
        time: "07:00",
        repeat_days: "mon,tue,wed,thu,fri",
      });
    });

    test("dias úteis", () => {
      expectParsed("dias úteis", {
        repeat_type: "weekdays",
      });
    });

    test("de segunda a sexta às 8:00", () => {
      expectParsed("de segunda a sexta às 8:00", {
        repeat_type: "weekdays",
        time: "08:00",
      });
    });
  });

  describe("recurrence - weekends", () => {
    test("fim de semana às 10", () => {
      expectParsed("fim de semana às 10", {
        repeat_type: "weekly",
        repeat_days: "sat,sun",
        time: "10:00",
      });
    });
  });

  describe("recurrence - monthly", () => {
    test("dia 10 de cada mês", () => {
      expectParsed("dia 10 de cada mês", {
        repeat_type: "monthly_day",
        repeat_value: "10",
      });
    });

    test("último dia do mês", () => {
      expectParsed("último dia do mês", {
        repeat_type: "monthly_last_day",
        rrule: "FREQ=MONTHLY;BYMONTHDAY=-1",
      });
    });

    test("primeiro dia do mês", () => {
      expectParsed("primeiro dia do mês", {
        repeat_type: "monthly_day",
        repeat_value: "1",
      });
    });

    test("primeira segunda do mês", () => {
      expectParsed("primeira segunda do mês", {
        repeat_type: "monthly_nth_weekday",
        repeat_value: "first_monday",
      });
    });

    test("último domingo do mês", () => {
      expectParsed("último domingo do mês", {
        repeat_type: "monthly_nth_weekday",
        repeat_value: "last_sunday",
      });
    });
  });

  describe("recurrence - interval", () => {
    test("a cada 3 dias às 10:00", () => {
      expectParsed("a cada 3 dias às 10:00", {
        repeat_type: "interval",
        repeat_interval: 3,
        time: "10:00",
      });
    });

    test("a cada 2 dias", () => {
      expectParsed("a cada 2 dias", {
        repeat_type: "interval",
        repeat_interval: 2,
      });
    });
  });

  describe("recurrence - yearly", () => {
    test("todo 25/12 às 8", () => {
      expectParsed("todo 25/12 às 8", {
        repeat_type: "yearly",
        repeat_value: "25/12",
        time: "08:00",
      });
    });
  });

  describe("one-time with date", () => {
    test("amanhã às 9", () => {
      const r = expectParsed("amanhã às 9", {
        time: "09:00",
        repeat_type: null,
      });
      expect(r.datetime).not.toBeNull();
    });

    test("depois de amanhã às 14:00", () => {
      const r = expectParsed("depois de amanhã às 14:00", {
        time: "14:00",
        repeat_type: null,
      });
      expect(r.datetime).not.toBeNull();
    });

    test("hoje às 23:59", () => {
      const r = parseDateInput("hoje às 23:59");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("23:59");
    });

    test("14/03 às 10:00", () => {
      const r = parseDateInput("14/03 às 10:00");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("10:00");
    });

    test("2026-03-20 às 15:00", () => {
      const r = parseDateInput("2026-03-20 às 15:00");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("15:00");
    });
  });

  describe("plain time", () => {
    test("14:30", () => {
      const r = parseDateInput("14:30");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("14:30");
    });

    test("8h30", () => {
      const r = parseDateInput("8h30");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("08:30");
    });

    test("9h", () => {
      const r = parseDateInput("9h");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("09:00");
    });
  });

  describe("error handling", () => {
    test("invalid input throws", () => {
      expect(() => parseDateInput("blablabla")).toThrow("PARSE_ERROR");
    });

    test("safeParseDateInput returns null on error", () => {
      expect(safeParseDateInput("blablabla")).toBeNull();
    });

    test("PARSE_ERROR_MESSAGE is defined", () => {
      expect(PARSE_ERROR_MESSAGE).toContain("Não consegui");
    });
  });

  describe("accent handling", () => {
    test("amanha (no accent)", () => {
      const r = parseDateInput("amanha às 9");
      expect(r.datetime).not.toBeNull();
      expect(r.time).toBe("09:00");
    });

    test("todo dia util (no accent)", () => {
      expectParsed("todo dia util às 7", {
        repeat_type: "weekdays",
        time: "07:00",
      });
    });
  });
});
