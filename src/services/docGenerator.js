import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs-extra";
import logger from "../utils/logger.js";

export class DocGenerator {
  /**
   * Generates a Word document from a template and data object.
   * @param {string} templatePath - Path to the .docx template
   * @param {Object} data - Values to inject into the template
   * @returns {Promise<Buffer>} - Generated document buffer
   */
  static async generate(templatePath, data) {
    try {
      const content = await fs.readFile(templatePath, "binary");
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      console.log(data);

      const newData = {
        ...data,
        period: getMonthDifference(data.startDate, data.endDate),
        currentDate: formatUzbekDate(getCurrentDate()),
        contractId: data.contractId.split("-")[0],
        startDate: formatUzbekDate(data.startDate),
        endDate: formatUzbekDate(data.endDate),
        debt: formatUzbekMoney(data.debt),
        totalDebt: formatUzbekMoney(data.totalDebt),
        totalAmount: formatUzbekMoney(data.totalAmount),
      };

      // Set the template variables
      doc.render(newData);

      const buf = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      return buf;
    } catch (error) {
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors
          .map(err => err.properties.explanation)
          .join("\n");
        logger.error(`Template Error:\n${errorMessages}`);
        throw new Error(`Template Error: ${errorMessages}`);
      }
      logger.error("Error generating Word document:", error);
      throw error;
    }
  }
}

function getMonthDifference(startDateStr, endDateStr) {
  const [startDay, startMonth, startYear] = startDateStr.split(".").map(Number);
  const [endDay, endMonth, endYear] = endDateStr.split(".").map(Number);

  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

function formatUzbekDate(dateStr) {
  const [day, month, year] = dateStr.split(".");

  const months = [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentabr",
    "oktabr",
    "noyabr",
    "dekabr",
  ];

  return `${year}-yil ${Number(day)}-${months[Number(month) - 1]}`;
}

function getCurrentDate() {
  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return `${day}.${month}.${year}`;
}

function formatUzbekMoney(amount) {
  const number = Number(amount).toFixed(2); // ensures 2 decimal places
  const [integerPart, decimalPart] = number.split(".");

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return `${formattedInteger} so'm ${decimalPart} tiyin`;
}
