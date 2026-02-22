import http from "http";
import logger from "./utils/logger.js";

const PORT = 3000;

export const startHealthCheckServer = () => {
  const server = http.createServer((req, res) => {
    const { url, method } = req;

    if (method === "GET") {
      if (url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Bank Bot is alive!");
        return;
      }

      if (url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })
        );
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(PORT, "0.0.0.0", () => {
    logger.info(`Health check server listening on port ${PORT}`);
  });

  server.on("error", error => {
    logger.error("Health check server error:", error);
  });
};
