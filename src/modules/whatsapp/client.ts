import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";
import { logger } from "../../config/logger";
import { loadSession } from "./session";
import { WhatsAppClient } from "./types";

let client: WhatsAppClient | null = null;

export async function startWhatsApp(): Promise<WhatsAppClient> {
  const { state, saveCreds } = await loadSession();
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ module: "baileys" }) as any,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info("QR code received — scan with WhatsApp");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      logger.info("WhatsApp connected");
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) {
        logger.warn("WhatsApp logged out — session cleared");
        client = null;
        return;
      }

      logger.info("WhatsApp disconnected — reconnecting...");
      startWhatsApp();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const sender = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!sender || !text) continue;

      logger.info({ sender, text }, "Message received");

      if (text.toLowerCase() === "ping") {
        await sock.sendMessage(sender, { text: "pong" });
        logger.info({ sender }, "Auto-replied: pong");
      }
    }
  });

  client = sock;
  return sock;
}

export function getWhatsAppClient(): WhatsAppClient | null {
  return client;
}
