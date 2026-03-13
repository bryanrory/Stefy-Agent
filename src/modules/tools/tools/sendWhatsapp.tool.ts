import { Tool } from "../tool.types";
import { getWhatsAppClient } from "../../whatsapp/client";

export const sendWhatsappTool: Tool = {
  name: "send_whatsapp",
  description: "Send a WhatsApp message to a phone number",
  inputSchema: {
    phone: { type: "string", description: "Phone number", required: true, example: "5511999999999" },
    text: { type: "string", description: "Message text", required: true, example: "Hello!" },
  },

  async execute(input: { phone: string; text: string }) {
    const { phone, text } = input;

    if (!phone || !text) {
      throw new Error("Missing required fields: phone, text");
    }

    const client = getWhatsAppClient();

    if (!client) {
      throw new Error("WhatsApp is not connected");
    }

    const jid = `${phone}@s.whatsapp.net`;
    await client.sendMessage(jid, { text });

    return { sent: true, to: phone, text };
  },
};
