import fastify from "fastify";
import { healthRoutes } from "./routes/health";

export function buildApp() {
  const app = fastify();

  app.register(healthRoutes);

  return app;
}
