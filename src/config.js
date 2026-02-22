import dotenv from "dotenv";
import path from "path";

dotenv.config();

const trimVal = val => (typeof val === "string" ? val.trim() : val);

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error(
    "CRITICAL ERROR: TELEGRAM_BOT_TOKEN is not defined in .env file"
  );
}

export const config = {
  telegram: {
    apiId: process.env.TELEGRAM_API_ID
      ? parseInt(process.env.TELEGRAM_API_ID.trim())
      : undefined,
    apiHash: trimVal(process.env.TELEGRAM_API_HASH),
    botToken: trimVal(process.env.TELEGRAM_BOT_TOKEN),
    sessionPath: path.resolve(
      trimVal(process.env.SESSION_PATH) || "./session.txt"
    ),
  },
  app: {
    logLevel: trimVal(process.env.LOG_LEVEL) || "info",
    tempDir: path.resolve(trimVal(process.env.TEMP_DIR) || "./temp"),
    templatePath: path.resolve(
      trimVal(process.env.TEMPLATE_PATH) || "./templates/doc_template.docx"
    ),
  },
};
