import { FastifyInstance } from "fastify";
import { runAgent } from "../modules/agent/agent";

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  app.post("/agent", async (request, reply) => {
    const { message } = request.body as { message: string };

    if (!message) {
      return reply.status(400).send({ error: "Missing required field: message" });
    }

    try {
      const result = await runAgent(message);
      return result;
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
