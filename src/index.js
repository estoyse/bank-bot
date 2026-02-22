import { BankBot } from "./bot.js";
import logger from "./utils/logger.js";
import fs from "fs-extra";
import { config } from "./config.js";
import { startHealthCheckServer } from "./server.js";

async function bootstrap() {
  try {
    // Ensure temp directory exists
    await fs.ensureDir(config.app.tempDir);

    const bot = new BankBot();

    // Start health check server
    startHealthCheckServer();

    await bot.start();

    logger.info("Bank Bot is running...");
  } catch (error) {
    logger.error("Failed to start bot:", error);
    process.exit(1);
  }
}

bootstrap();

// Global unhandled rejection handling
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
