import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import importRouter from "./routes/import.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.port || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

// CORS configuration
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "50mb" }));

// GET /health
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Import router mounting
app.use("/api/import", importRouter);

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[SERVER ERROR]:", err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || "Internal server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`[GrowEasy Backend] Server listening on http://localhost:${PORT}`);
});
