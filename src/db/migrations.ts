import { query } from "./index";
import { logger } from "../config/logger";

export async function runMigrations(): Promise<void> {
  logger.info("Running database migrations...");

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Add user_id to reminders if it doesn't exist
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reminders' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE reminders ADD COLUMN user_id INTEGER REFERENCES users(id);
      END IF;
    END $$
  `);

  // Add datetime to reminders if it doesn't exist
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reminders' AND column_name = 'datetime'
      ) THEN
        ALTER TABLE reminders ADD COLUMN datetime TIMESTAMP;
      END IF;
    END $$
  `);

  // Add repeat to reminders if it doesn't exist (default false = one-time)
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reminders' AND column_name = 'repeat'
      ) THEN
        ALTER TABLE reminders ADD COLUMN repeat BOOLEAN DEFAULT false;
        UPDATE reminders SET repeat = false WHERE repeat IS NULL;
      END IF;
    END $$
  `);

  // Add require_confirmation and confirmed to reminders
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reminders' AND column_name = 'require_confirmation'
      ) THEN
        ALTER TABLE reminders ADD COLUMN require_confirmation BOOLEAN DEFAULT false;
        ALTER TABLE reminders ADD COLUMN confirmed BOOLEAN DEFAULT false;
        UPDATE reminders SET require_confirmation = false, confirmed = false
          WHERE require_confirmation IS NULL;
      END IF;
    END $$
  `);

  // Add recurrence fields to reminders
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reminders' AND column_name = 'repeat_type'
      ) THEN
        ALTER TABLE reminders ADD COLUMN repeat_type TEXT;
        ALTER TABLE reminders ADD COLUMN repeat_value TEXT;
        ALTER TABLE reminders ADD COLUMN repeat_days TEXT;
        ALTER TABLE reminders ADD COLUMN repeat_interval INTEGER;
      END IF;
    END $$
  `);

  // Add last_sent_at to reminders for confirmation follow-up tracking
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reminders' AND column_name = 'last_sent_at'
      ) THEN
        ALTER TABLE reminders ADD COLUMN last_sent_at TIMESTAMP;
      END IF;
    END $$
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS lists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS list_items (
      id SERIAL PRIMARY KEY,
      list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
      text VARCHAR(500) NOT NULL,
      done BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  logger.info("Migrations complete");
}
