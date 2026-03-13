import { query } from "../../db";
import { User, CreateUserInput } from "./user.types";

export async function createUser(input: CreateUserInput): Promise<User> {
  const result = await query<User>(
    "INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING *",
    [input.phone, input.name]
  );
  return result.rows[0];
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const result = await query<User>(
    "SELECT * FROM users WHERE phone = $1",
    [phone]
  );
  return result.rows[0] || null;
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await query<User>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function getAllUsers(): Promise<User[]> {
  const result = await query<User>(
    "SELECT * FROM users ORDER BY created_at DESC"
  );
  return result.rows;
}
