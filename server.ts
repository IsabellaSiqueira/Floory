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

  // Generate Image via Floory Nano Banana concept
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `Crie um design de pintura luxuoso e exclusivo para um jato executivo de grande porte (como um Bombardier Global 6000) seguindo a seguinte descrição: ${prompt}. A imagem deve ser fotorrealista, em um hangar sofisticado e escuro com iluminação dramática, ressaltando o acabamento do avião.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (!base64Image) {
        throw new Error("No image data found in response");
      }

      res.json({ 
        success: true, 
        imageUrl: `data:image/png;base64,${base64Image}` 
      });

    } catch (error: any) {
      console.error("Gemini Image Error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate image",
        details: error.details || []
      });
    }
  });

  // Floory AI Chat Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const formattedContents = messages.map(msg => ({
        role: msg.role === "assistant" ? "model" as const : "user" as const,
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: formattedContents,
        config: {
          systemInstruction: "Você é o Diretor de Projetos VIP da Floory Aviation. Seu nome é Floory Assistant. Seu tom é sofisticado, técnico e extremamente atencioso. Você ajuda clientes de alto nível a acompanhar seus projetos de personalização de jatos. O projeto atual é o PR-NEY (Bombardier Global 6000), que está no hangar em Jundiaí/SP, na fase de 'Verniz Final' com entrega prevista para 05 Abr."
        }
      });

      res.json({ 
        success: true, 
        message: response.text || "Sem resposta do assistente."
      });

    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
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
