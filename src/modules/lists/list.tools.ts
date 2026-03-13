import { Tool, ToolContext } from "../tools/tool.types";
import * as listService from "./list.service";

export const createListTool: Tool = {
  name: "create_list",
  description: "Create a new list (e.g. shopping, tasks, notes)",
  inputSchema: {
    name: { type: "string", description: "List name", required: true, example: "shopping" },
  },

  async execute(input: { name: string }, context?: ToolContext) {
    if (!context) throw new Error("User context required");
    if (!input.name) throw new Error("Missing required field: name");
    return listService.createList(context.userId, input.name);
  },
};

export const addItemTool: Tool = {
  name: "add_item",
  description: "Add an item to a list",
  inputSchema: {
    list: { type: "string", description: "List name or ID", required: true, example: "shopping" },
    text: { type: "string", description: "Item text", required: true, example: "milk" },
  },

  async execute(input: { list: string; text: string }, context?: ToolContext) {
    if (!context) throw new Error("User context required");
    if (!input.list || !input.text) throw new Error("Missing required fields: list, text");
    return listService.addItem(context.userId, input.list, input.text);
  },
};

export const listItemsTool: Tool = {
  name: "list_items",
  description: "Show all items in a list",
  inputSchema: {
    list: { type: "string", description: "List name or ID", required: true, example: "shopping" },
  },

  async execute(input: { list: string }, context?: ToolContext) {
    if (!context) throw new Error("User context required");
    if (!input.list) throw new Error("Missing required field: list");
    return listService.getItems(context.userId, input.list);
  },
};

export const removeItemTool: Tool = {
  name: "remove_item",
  description: "Remove an item from a list by item ID",
  inputSchema: {
    list: { type: "string", description: "List name or ID", required: true, example: "shopping" },
    item_id: { type: "number", description: "Item ID to remove", required: true, example: 1 },
  },

  async execute(input: { list: string; item_id: number }, context?: ToolContext) {
    if (!context) throw new Error("User context required");
    if (!input.list || input.item_id === undefined) throw new Error("Missing required fields: list, item_id");
    const removed = await listService.removeItem(context.userId, input.list, Number(input.item_id));
    if (!removed) throw new Error("Item not found");
    return removed;
  },
};

export const markDoneTool: Tool = {
  name: "mark_done",
  description: "Mark a list item as done by item ID",
  inputSchema: {
    list: { type: "string", description: "List name or ID", required: true, example: "shopping" },
    item_id: { type: "number", description: "Item ID to mark as done", required: true, example: 1 },
  },

  async execute(input: { list: string; item_id: number }, context?: ToolContext) {
    if (!context) throw new Error("User context required");
    if (!input.list || input.item_id === undefined) throw new Error("Missing required fields: list, item_id");
    const updated = await listService.markDone(context.userId, input.list, Number(input.item_id));
    if (!updated) throw new Error("Item not found");
    return updated;
  },
};
