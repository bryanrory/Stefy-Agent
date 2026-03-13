import fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { reminderRoutes } from "./routes/reminders";

export function buildApp() {
  const app = fastify();

  app.register(healthRoutes);
  app.register(reminderRoutes);

  return app;
}
