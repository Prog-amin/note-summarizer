import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGenerateSummary, handleShareSummary } from "./routes/summary";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Increase limit for longer transcripts
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Test endpoint for debugging
  app.post("/api/test", (req, res) => {
    console.log("Test endpoint called with body:", req.body);
    res.json({ message: "Test successful", received: req.body });
  });

  // AI Meeting Summary routes
  app.post("/api/generate-summary", handleGenerateSummary);
  app.post("/api/share-summary", handleShareSummary);

  return app;
}
