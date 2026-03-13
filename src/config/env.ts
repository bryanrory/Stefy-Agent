import dotenv from "dotenv";

dotenv.config();

const required = [
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASS",
  "DB_NAME",
  "ANTHROPIC_API_KEY",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

export const env = {
  PORT: Number(process.env.PORT),
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER!,
  DB_PASS: process.env.DB_PASS!,
  DB_NAME: process.env.DB_NAME!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  BOT_PREFIX: process.env.BOT_PREFIX || "bot",
};
