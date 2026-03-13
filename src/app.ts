import fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { reminderRoutes } from "./routes/reminders";
import { toolRoutes } from "./routes/tool";
import { agentRoutes } from "./routes/agent";

export function buildApp() {
  const app = fastify();

  app.register(healthRoutes);
  app.register(reminderRoutes);
  app.register(toolRoutes);
  app.register(agentRoutes);

  return app;
}
