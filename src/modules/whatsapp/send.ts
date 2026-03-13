import { logger } from "../../config/logger";
import { loadSession } from "./session";
import makeWASocket, { fetchLatestBaileysVersion } from "@whiskeysockets/baileys";

async function main() {
  const [, , number, text] = process.argv;

  if (!number || !text) {
    console.log("Usage: npm run send <number> <message>");
    console.log("Example: npm run send 5511999999999 \"Oi\"");
    process.exit(1);
  }

  const jid = `${number}@s.whatsapp.net`;

  const { state, saveCreds } = await loadSession();
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ module: "baileys" }) as any,
  });

  sock.ev.on("creds.update", saveCreds);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Connection timeout")), 15000);

    sock.ev.on("connection.update", (update) => {
      if (update.connection === "open") {
        clearTimeout(timeout);
        resolve();
      }
      if (update.connection === "close") {
        clearTimeout(timeout);
        reject(new Error("Failed to connect — scan QR first with npm run dev"));
      }
    });
  });

  await sock.sendMessage(jid, { text });
  logger.info({ to: number, text }, "Message sent");

  await sock.end(undefined);
  process.exit(0);
}

main().catch((err) => {
  logger.error(err, "Failed to send message");
  process.exit(1);
});
