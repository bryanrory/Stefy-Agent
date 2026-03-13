import { FastifyInstance } from "fastify";
import { executeTool } from "../modules/tools/tool.executor";

export async function toolRoutes(app: FastifyInstance): Promise<void> {
  app.post("/tool", async (request, reply) => {
    const { name, input } = request.body as { name: string; input?: any };

    if (!name) {
      return reply.status(400).send({ error: "Missing required field: name" });
    }

    try {
      const result = await executeTool(name, input || {});
      return { success: true, tool: name, result };
    } catch (err: any) {
      return reply.status(400).send({ success: false, tool: name, error: err.message });
    }
  });
}
