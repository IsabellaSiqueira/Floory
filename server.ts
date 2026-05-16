import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Floory Engineering API" });
  });

  // TODO: Integrar com Gemini 3.1 Pro JSON API para os cálculos de engenharia
  app.post("/api/engineering-report", async (req, res) => {
    try {
      const { aircraftId } = req.body;
      // Mocking Gemini response for now
      // Here we would use process.env.GEMINI_API_KEY
      res.json({
        success: true,
        data: {
          additionalWeight: 42.4,
          aerodynamicDragReduction: 1.2,
          certification: "ANAC-145",
          validationSmallPrint: "Parâmetros validados conforme manual do fabricante."
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate engineering report" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Floory server running on http://localhost:${PORT}`);
  });
}

startServer();
