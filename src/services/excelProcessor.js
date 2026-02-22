import xlsx from "xlsx";
import logger from "../utils/logger.js";

export class ExcelProcessor {
  /**
   * Parses an Excel file buffer and returns an array of objects representing rows.
   * Handles dynamic headers and duplicate column names.
   * @param {Buffer} buffer - Excel file buffer
   * @returns {Array<Object>}
   */
  static parse(buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert worksheet to array of arrays to handle duplicates manually
      const data = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      if (data.length < 2) {
        return [];
      }

      const rawHeaders = data[0];
      const rows = data.slice(1);

      // Handle duplicate headers by appending an index
      const headers = rawHeaders.map((header, index) => {
        const h = String(header || "").trim();
        const count = rawHeaders
          .slice(0, index)
          .filter(rh => String(rh || "").trim() === h).length;
        return count > 0 ? `${h}_${count}` : h;
      });

      const result = rows
        .filter(row => row.some(cell => cell !== "")) // Ignore empty rows
        .map(row => {
          const rowObj = {};
          headers.forEach((header, index) => {
            if (header) {
              rowObj[header] = row[index] !== undefined ? row[index] : "";
            }
          });
          return rowObj;
        });

      logger.info(`Parsed ${result.length} rows from Excel.`);
      return result;
    } catch (error) {
      logger.error("Error parsing Excel:", error);
      throw new Error("Failed to parse Excel file.");
    }
  }
}
