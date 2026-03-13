import { FastifyInstance } from "fastify";
import { createReminder, listReminders, removeReminder } from "../modules/reminders/reminder.service";
import { updateReminder } from "../modules/reminders/reminder.model";

export async function reminderRoutes(app: FastifyInstance): Promise<void> {
  app.post("/reminders", async (request, reply) => {
    const { text, time, target } = request.body as {
      text: string;
      time: string;
      target: string;
    };

    if (!text || !time || !target) {
      return reply.status(400).send({ error: "Missing required fields: text, time, target" });
    }

    try {
      const reminder = await createReminder({ text, time, target });
      return reply.status(201).send(reminder);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  app.get("/reminders", async () => {
    return listReminders();
  });

  app.delete("/reminders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const removed = await removeReminder(Number(id));

    if (!removed) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return removed;
  });

  app.patch("/reminders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const fields = request.body as {
      text?: string;
      time?: string;
      target?: string;
      active?: boolean;
    };

    const updated = await updateReminder(Number(id), fields);

    if (!updated) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return updated;
  });
}
