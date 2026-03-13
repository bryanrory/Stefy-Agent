import { env } from "../src/config/env";
import { logger } from "../src/config/logger";
import { connectDatabase } from "../src/db";
import { createReminder } from "../src/modules/reminders/reminder.service";

async function main() {
  const [, , text, time, target] = process.argv;

  if (!text || !time || !target) {
    console.log("Usage: npm run add-reminder <text> <time> <target>");
    console.log('Example: npm run add-reminder "Tomar remédio" 08:30 5511999999999');
    process.exit(1);
  }

  await connectDatabase();

  const reminder = await createReminder({ text, time, target });
  logger.info({ reminder }, "Reminder created successfully");

  process.exit(0);
}

main().catch((err) => {
  logger.error(err, "Failed to create reminder");
  process.exit(1);
});
