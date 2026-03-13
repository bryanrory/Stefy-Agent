import path from "path";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";

const SESSION_DIR = path.resolve(process.cwd(), "session");

export async function loadSession() {
  return useMultiFileAuthState(SESSION_DIR);
}
