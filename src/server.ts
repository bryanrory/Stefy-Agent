import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabase } from "./db";
import { buildApp } from "./app";

async function start() {
  await connectDatabase();

  const app = buildApp();

  await app.listen({ port: env.PORT, host: "0.0.0.0" });

  logger.info(`Server running on http://localhost:${env.PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start server");
  process.exit(1);
});
