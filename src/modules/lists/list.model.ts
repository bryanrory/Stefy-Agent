import { query } from "../../db";
import { List, ListItem } from "./list.types";

export async function createList(userId: number, name: string): Promise<List> {
  const result = await query<List>(
    "INSERT INTO lists (user_id, name) VALUES ($1, $2) RETURNING *",
    [userId, name]
  );
  return result.rows[0];
}

export async function getListsByUser(userId: number): Promise<List[]> {
  const result = await query<List>(
    "SELECT * FROM lists WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows;
}

export async function getListById(id: number, userId: number): Promise<List | null> {
  const result = await query<List>(
    "SELECT * FROM lists WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function getListByName(userId: number, name: string): Promise<List | null> {
  const result = await query<List>(
    "SELECT * FROM lists WHERE user_id = $1 AND LOWER(name) = LOWER($2)",
    [userId, name]
  );
  return result.rows[0] || null;
}

export async function deleteList(id: number, userId: number): Promise<List | null> {
  const result = await query<List>(
    "DELETE FROM lists WHERE id = $1 AND user_id = $2 RETURNING *",
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function addItem(listId: number, text: string): Promise<ListItem> {
  const result = await query<ListItem>(
    "INSERT INTO list_items (list_id, text) VALUES ($1, $2) RETURNING *",
    [listId, text]
  );
  return result.rows[0];
}

export async function getItems(listId: number): Promise<ListItem[]> {
  const result = await query<ListItem>(
    "SELECT * FROM list_items WHERE list_id = $1 ORDER BY created_at ASC",
    [listId]
  );
  return result.rows;
}

export async function removeItem(itemId: number, listId: number): Promise<ListItem | null> {
  const result = await query<ListItem>(
    "DELETE FROM list_items WHERE id = $1 AND list_id = $2 RETURNING *",
    [itemId, listId]
  );
  return result.rows[0] || null;
}

export async function markItemDone(itemId: number, listId: number): Promise<ListItem | null> {
  const result = await query<ListItem>(
    "UPDATE list_items SET done = true WHERE id = $1 AND list_id = $2 RETURNING *",
    [itemId, listId]
  );
  return result.rows[0] || null;
}
