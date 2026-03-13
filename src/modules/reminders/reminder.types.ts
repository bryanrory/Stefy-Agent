export interface Reminder {
  id: number;
  text: string;
  time: string;
  target: string;
  active: boolean;
  created_at: Date;
}

export interface CreateReminderInput {
  text: string;
  time: string;
  target: string;
}
