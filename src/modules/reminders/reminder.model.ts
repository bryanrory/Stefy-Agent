import { query } from "../../db";
import { Reminder, CreateReminderInput } from "./reminder.types";

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const result = await query<Reminder>(
    "INSERT INTO reminders (text, time, datetime, target, user_id, repeat, require_confirmation, repeat_type, repeat_value, repeat_days, repeat_interval, rrule, timezone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
    [
      input.text,
      input.time,
      input.datetime ?? null,
      input.target,
      input.user_id ?? null,
      input.repeat ?? false,
      input.require_confirmation ?? false,
      input.repeat_type ?? null,
      input.repeat_value ?? null,
      input.repeat_days ?? null,
      input.repeat_interval ?? null,
      input.rrule ?? null,
      input.timezone ?? null,
    ]
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
    "SELECT * FROM reminders WHERE active = true AND time = $1 AND datetime IS NULL",
    [time]
  );
  return result.rows;
}

export async function getRecurringRemindersByTime(time: string): Promise<Reminder[]> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders WHERE active = true AND repeat_type IS NOT NULL AND repeat_type != 'once' AND time = $1",
    [time]
  );
  return result.rows;
}

export async function getDueReminders(now: Date): Promise<Reminder[]> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders WHERE active = true AND datetime IS NOT NULL AND datetime <= $1",
    [now]
  );
  return result.rows;
}

export async function deactivateReminder(id: number): Promise<void> {
  await query("UPDATE reminders SET active = false WHERE id = $1", [id]);
}

export async function getAllReminders(userId?: number): Promise<Reminder[]> {
  if (userId) {
    const result = await query<Reminder>(
      "SELECT * FROM reminders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows;
  }
  const result = await query<Reminder>(
    "SELECT * FROM reminders ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function deleteReminder(id: number, userId?: number): Promise<Reminder | null> {
  if (userId) {
    const result = await query<Reminder>(
      "DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );
    return result.rows[0] || null;
  }
  const result = await query<Reminder>(
    "DELETE FROM reminders WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

export async function getUnconfirmedReminders(now: Date): Promise<Reminder[]> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders WHERE require_confirmation = true AND confirmed = false AND active = false AND last_sent_at IS NOT NULL AND last_sent_at <= ($1::timestamp - INTERVAL '5 minutes')",
    [now]
  );
  return result.rows;
}

export async function updateLastSentAt(id: number, now: Date): Promise<void> {
  await query("UPDATE reminders SET last_sent_at = $1 WHERE id = $2", [now, id]);
}

export async function getPendingConfirmation(phone: string): Promise<Reminder | null> {
  const result = await query<Reminder>(
    "SELECT * FROM reminders WHERE target = $1 AND require_confirmation = true AND confirmed = false AND active = false ORDER BY last_sent_at DESC LIMIT 1",
    [phone]
  );
  return result.rows[0] || null;
}

export async function confirmReminder(id: number): Promise<Reminder | null> {
  const result = await query<Reminder>(
    "UPDATE reminders SET confirmed = true WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

export async function updateReminder(
  id: number,
  fields: Partial<Pick<Reminder, "text" | "time" | "target" | "active" | "repeat" | "require_confirmation" | "confirmed">>
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
  if (fields.repeat !== undefined) {
    sets.push(`repeat = $${idx++}`);
    values.push(fields.repeat);
  }
  if (fields.require_confirmation !== undefined) {
    sets.push(`require_confirmation = $${idx++}`);
    values.push(fields.require_confirmation);
  }
  if (fields.confirmed !== undefined) {
    sets.push(`confirmed = $${idx++}`);
    values.push(fields.confirmed);
  }

  if (sets.length === 0) return null;

  values.push(id);
  const result = await query<Reminder>(
    `UPDATE reminders SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}
