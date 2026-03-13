import { createUser as createUserDB, getUserByPhone } from "./user.model";
import { CreateUserInput, User } from "./user.types";

export async function getOrCreateUser(input: CreateUserInput): Promise<User> {
  const existing = await getUserByPhone(input.phone);
  if (existing) return existing;
  return createUserDB(input);
}
