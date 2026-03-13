import { FastifyInstance } from "fastify";
import { runAgent } from "../modules/agent/agent";

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  app.post("/agent", async (request, reply) => {
    const { message, userId, phone } = request.body as {
      message: string;
      userId?: number;
      phone?: string;
    };

    if (!message) {
      return reply.status(400).send({ error: "Missing required field: message" });
    }

    try {
      const result = await runAgent(message, userId, phone);
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
