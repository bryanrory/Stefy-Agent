import { query } from "../../db";
import { Reminder, CreateReminderInput } from "./reminder.types";

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const result = await query<Reminder>(
    "INSERT INTO reminders (text, time, target) VALUES ($1, $2, $3) RETURNING *",
    [input.text, input.time, input.target]
  );
  return result.rows[0];
}

export async function getActiveReminders(): Promise<Reminder[]> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders WHERE active = true"
  );
  return result.rows;
}

export async function getActiveRemindersByTime(time: string): Promise<Reminder[]> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders WHERE active = true AND time = $1",
    [time]
  );
  return result.rows;
}

export async function getAllReminders(): Promise<Reminder[]> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function deleteReminder(id: number): Promise<Reminder | null> {
  const result = await query<Reminder>(
    "DELETE FROM reminders WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

export async function updateReminder(
  id: number,
  fields: Partial<Pick<Reminder, "text" | "time" | "target" | "active">>
): Promise<Reminder | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (fields.text !== undefined) {
    sets.push(`text = $${idx++}`);
    values.push(fields.text);
  }
  if (fields.time !== undefined) {
    sets.push(`time = $${idx++}`);
    values.push(fields.time);
  }
  if (fields.target !== undefined) {
    sets.push(`target = $${idx++}`);
    values.push(fields.target);
  }
  if (fields.active !== undefined) {
    sets.push(`active = $${idx++}`);
    values.push(fields.active);
  }

  if (sets.length === 0) return null;

  values.push(id);
  const result = await query<Reminder>(
    `UPDATE reminders SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}
