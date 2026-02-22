import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import fs from "fs-extra";
import path from "path";
import { config } from "./config.js";
import logger from "./utils/logger.js";
import { ExcelProcessor } from "./services/excelProcessor.js";
import { DocGenerator } from "./services/docGenerator.js";
import { FileManager } from "./services/fileManager.js";
import { CustomFile } from "telegram/client/uploads.js";

export class BankBot {
  constructor() {
    let sessionString = "";
    if (fs.existsSync(config.telegram.sessionPath)) {
      sessionString = fs.readFileSync(config.telegram.sessionPath, "utf8");
      logger.info("Loaded existing session string.");
    }
    this.client = new TelegramClient(
      new StringSession(sessionString),
      config.telegram.apiId,
      config.telegram.apiHash,
      { connectionRetries: 5 }
    );
  }

  async start() {
    logger.info(`Starting bot with API ID: ${config.telegram.apiId}`);
    if (!config.telegram.botToken) {
      logger.error("Bot token is missing in config!");
    } else {
      logger.info(`Bot token length: ${config.telegram.botToken.length}`);
    }

    await this.client.start({
      botAuthToken: config.telegram.botToken,
    });

    // Save session string for reuse
    const sessionString = this.client.session.save();
    fs.writeFileSync(config.telegram.sessionPath, sessionString, "utf8");
    logger.info("Session string saved to file.");

    logger.info("Bot started successfully.");

    this.client.addEventHandler(
      this.onNewMessage.bind(this),
      new NewMessage({})
    );
  }

  async onNewMessage(event) {
    const message = event.message;
    const sender = await message.getSender();
    const chatId = message.chatId;

    if (message.text === "/start") {
      await this.client.sendMessage(chatId, {
        message:
          "Assalomu alaykum! Please upload an Excel (.xlsx) file to generate documents.",
      });
      return;
    }

    if (message.media && message.media instanceof Api.MessageMediaDocument) {
      const document = message.media.document;
      const fileName =
        document.attributes.find(
          a => a instanceof Api.DocumentAttributeFilename
        )?.fileName || "file.xlsx";

      if (!fileName.endsWith(".xlsx")) {
        await this.client.sendMessage(chatId, {
          message: "Invalid file type. Please upload a .xlsx file.",
        });
        return;
      }

      await this.processExcelMessage(message, chatId, fileName);
    }
  }

  async processExcelMessage(message, chatId, fileName) {
    let transactionDir = null;
    try {
      await this.client.sendMessage(chatId, {
        message: "Processing your file... Please wait.",
      });

      const buffer = await this.client.downloadMedia(message.media, {
        workers: 1,
      });
      const rows = ExcelProcessor.parse(buffer);

      if (rows.length === 0) {
        await this.client.sendMessage(chatId, {
          message: "The Excel file is empty or has no data rows.",
        });
        return;
      }

      if (!(await fs.pathExists(config.app.templatePath))) {
        logger.error(`Template not found at ${config.app.templatePath}`);
        await this.client.sendMessage(chatId, {
          message:
            "Server error: Word template not found. Please contact admin.",
        });
        return;
      }

      transactionDir = await FileManager.createTransactionDir();
      const docsDir = path.join(transactionDir, "docs");
      await fs.ensureDir(docsDir);

      const generatedFiles = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const docBuffer = await DocGenerator.generate(
          config.app.templatePath,
          row
        );
        const docFileName = `${row.fullName || `doc_${i + 1}`}.docx`.replace(
          /[/\\?%*:|"<>]/g,
          "-"
        );
        const docPath = path.join(docsDir, docFileName);

        await FileManager.saveFile(docPath, docBuffer);
        generatedFiles.push({
          path: docPath,
          name: docFileName,
          buffer: docBuffer,
        });
      }

      if (rows.length > 20) {
        const zipPath = path.join(transactionDir, "documents.zip");
        await FileManager.zipDirectory(docsDir, zipPath);
        await this.client.sendFile(chatId, {
          file: zipPath,
          caption: `Generated ${rows.length} documents.`,
        });
      } else {
        for (const file of generatedFiles) {
          await this.client.sendFile(chatId, {
            file: new CustomFile(
              file.name,
              file.buffer.length,
              file.path,
              file.buffer
            ),
            caption: file.name,
          });
        }
        await this.client.sendMessage(chatId, {
          message: `Completed! Sent ${rows.length} documents.`,
        });
      }
    } catch (error) {
      logger.error("Error processing message:", error);
      const errorMessage = error.message.includes("Template Error")
        ? `Template Syntax Error:\n${error.message}`
        : "An error occurred while processing your file.";
      await this.client.sendMessage(chatId, {
        message: errorMessage,
      });
    } finally {
      if (transactionDir) {
        await FileManager.cleanup(transactionDir);
      }
    }
  }
}
