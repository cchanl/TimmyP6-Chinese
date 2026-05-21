import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty } from "./types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());

  // API router / endpoints
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { words, count, difficulty } = req.body;

      if (!words || !Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ error: "Words array is required and must not be empty" });
      }

      // Check both GEMINI_API_KEY and API_KEY, keep fallback
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in the environment");
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const selectedDifficulty = difficulty || Difficulty.MEDIUM;

      const difficultyDesc = {
        [Difficulty.EASY]: "Simple and straightforward sentences. Use common daily life vocabulary. The context should be very clear and easy to understand.",
        [Difficulty.MEDIUM]: "Moderate complexity. Suitable for Grade 6 level. Sentences may include more descriptive language and varied contexts.",
        [Difficulty.HARD]: "Challenging sentences. Use more formal or literary language. The context may require deeper understanding of the word's nuances or metaphorical uses."
      }[selectedDifficulty as Difficulty];

      const prompt = `
        Act as a professional primary school Chinese teacher.
        
        Task: Design a fill-in-the-blank vocabulary quiz.
        Target Audience: 6th-grade students (approx. 11-12 years old).
        
        Requirements:
        1. Use the following list of words: ${words.join(", ")}.
        2. Generate exactly ${count || 20} questions. 
           - If there are fewer words than questions, you MUST reuse words to reach exactly ${count || 20} questions.
           - If there are more words than questions, select the most appropriate ones, but prioritize using as many unique words from the list as possible.
        3. Context: Daily life scenarios or student experiences.
        4. Difficulty Level: ${selectedDifficulty}. 
           Description: ${difficultyDesc}
        5. Output Format: A JSON array.
        6. For each question, provide a brief explanation (in Traditional Chinese) suitable for a 6th grader. The explanation should clarify why the answer is correct based on the context or meaning of the word.
        
        The sentence should be split into two parts: 'before' the blank and 'after' the blank.
        The 'answer' must be one of the words from the provided list.
      `;

      // Utilize gemini-3.5-flash as the latest standard for basic text tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                part1: { type: Type.STRING, description: "Text before the blank" },
                part2: { type: Type.STRING, description: "Text after the blank" },
                answer: { type: Type.STRING, description: "The correct word from the list" },
                explanation: { type: Type.STRING, description: "Explanation why this word fits the context" },
              },
              required: ["id", "part1", "part2", "answer", "explanation"],
            },
          },
        },
      });

      const rawText = response.text || "[]";
      const rawData = JSON.parse(rawText);

      return res.json(rawData);
    } catch (error: any) {
      console.error("Server-side Gemini generation error:", error);
      return res.status(500).json({ error: error?.message || "An error occurred during quiz generation" });
    }
  });

  // Vite middleware setup or Static assets serving
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
