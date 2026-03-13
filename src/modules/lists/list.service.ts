import { logger } from "../../config/logger";
import * as model from "./list.model";
import { List, ListItem } from "./list.types";

export async function createList(userId: number, name: string): Promise<List> {
  const existing = await model.getListByName(userId, name);
  if (existing) {
    throw new Error(`List "${name}" already exists`);
  }
  const list = await model.createList(userId, name);
  logger.info({ list }, "List created");
  return list;
}

export async function getUserLists(userId: number): Promise<List[]> {
  return model.getListsByUser(userId);
}

export async function resolveList(userId: number, listIdOrName: string | number): Promise<List> {
  if (typeof listIdOrName === "number" || /^\d+$/.test(String(listIdOrName))) {
    const list = await model.getListById(Number(listIdOrName), userId);
    if (!list) throw new Error(`List not found`);
    return list;
  }
  const list = await model.getListByName(userId, String(listIdOrName));
  if (!list) throw new Error(`List "${listIdOrName}" not found`);
  return list;
}

export async function addItem(userId: number, listIdOrName: string | number, text: string): Promise<ListItem> {
  const list = await resolveList(userId, listIdOrName);
  const item = await model.addItem(list.id, text);
  logger.info({ item }, "Item added");
  return item;
}

export async function getItems(userId: number, listIdOrName: string | number): Promise<{ list: List; items: ListItem[] }> {
  const list = await resolveList(userId, listIdOrName);
  const items = await model.getItems(list.id);
  return { list, items };
}

export async function removeItem(userId: number, listIdOrName: string | number, itemId: number): Promise<ListItem | null> {
  const list = await resolveList(userId, listIdOrName);
  const removed = await model.removeItem(itemId, list.id);
  if (removed) {
    logger.info({ itemId }, "Item removed");
  }
  return removed;
}

export async function markDone(userId: number, listIdOrName: string | number, itemId: number): Promise<ListItem | null> {
  const list = await resolveList(userId, listIdOrName);
  const updated = await model.markItemDone(itemId, list.id);
  if (updated) {
    logger.info({ itemId }, "Item marked done");
  }
  return updated;
}

export async function deleteList(userId: number, listIdOrName: string | number): Promise<List | null> {
  const list = await resolveList(userId, listIdOrName);
  const deleted = await model.deleteList(list.id, userId);
  if (deleted) {
    logger.info({ listId: list.id }, "List deleted");
  }
  return deleted;
}
