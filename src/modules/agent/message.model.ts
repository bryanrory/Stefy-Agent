import { query } from "../../db";

export interface Message {
  id: number;
  user_id: number;
  role: string;
  content: string;
  created_at: Date;
}

export async function saveMessage(userId: number, role: string, content: string): Promise<void> {
  await query(
    "INSERT INTO messages (user_id, role, content) VALUES ($1, $2, $3)",
    [userId, role, content]
  );
}

export async function getRecentMessages(userId: number, limit: number = 20): Promise<Message[]> {
  const result = await query<Message>(
    "SELECT * FROM messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, limit]
  );
  return result.rows.reverse();
}
