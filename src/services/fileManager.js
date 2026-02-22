import fs from "fs-extra";
import path from "path";
import AdmZip from "adm-zip";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";
import { config } from "../config.js";

export class FileManager {
  /**
   * Creates a unique transaction directory in the temp folder.
   * @returns {string} - Path to the created directory
   */
  static async createTransactionDir() {
    const id = uuidv4();
    const dir = path.join(config.app.tempDir, id);
    await fs.ensureDir(dir);
    return dir;
  }

  /**
   * Saves a buffer to a file.
   * @param {string} filePath - Absolute path to the file
   * @param {Buffer} buffer - Content to save
   */
  static async saveFile(filePath, buffer) {
    await fs.writeFile(filePath, buffer);
  }

  /**
   * Zips all files in a directory.
   * @param {string} sourceDir - Directory containing files to zip
   * @param {string} outPath - Path where the zip file should be saved
   */
  static async zipDirectory(sourceDir, outPath) {
    const zip = new AdmZip();
    zip.addLocalFolder(sourceDir);
    zip.writeZip(outPath);
    logger.info(`Zipped directory ${sourceDir} to ${outPath}`);
  }

  /**
   * Cleans up a transaction directory.
   * @param {string} dirPath - Path to the directory to remove
   */
  static async cleanup(dirPath) {
    try {
      if (dirPath && (await fs.pathExists(dirPath))) {
        await fs.remove(dirPath);
        logger.info(`Cleaned up directory: ${dirPath}`);
      }
    } catch (error) {
      logger.error(`Error during cleanup of ${dirPath}:`, error);
    }
  }
}
