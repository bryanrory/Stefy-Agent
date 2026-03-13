import { WASocket } from "@whiskeysockets/baileys";

export interface WhatsAppMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export type WhatsAppClient = WASocket;
