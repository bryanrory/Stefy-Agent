export type RepeatType =
  | "once"
  | "daily"
  | "weekly"
  | "weekdays"
  | "monthly_day"
  | "monthly_last_day"
  | "monthly_nth_weekday"
  | "interval"
  | "yearly";

export interface Reminder {
  id: number;
  user_id: number | null;
  text: string;
  time: string;
  datetime: Date | null;
  target: string;
  active: boolean;
  repeat: boolean;
  require_confirmation: boolean;
  confirmed: boolean;
  last_sent_at: Date | null;
  repeat_type: RepeatType | null;
  repeat_value: string | null;
  repeat_days: string | null;
  repeat_interval: number | null;
  rrule: string | null;
  timezone: string | null;
  created_at: Date;
}

export interface CreateReminderInput {
  user_id?: number;
  text: string;
  time: string;
  datetime?: Date | null;
  target: string;
  repeat?: boolean;
  require_confirmation?: boolean;
  repeat_type?: RepeatType;
  repeat_value?: string;
  repeat_days?: string;
  repeat_interval?: number;
  rrule?: string;
  timezone?: string;
}
