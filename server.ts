import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Route for generating the mind map from Telugu content
  app.post("/api/generate-mind-map", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Content is required and cannot be empty." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured. Please add your Gemini API Key in the Secrets panel in AI Studio settings." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // We request a detailed conceptual structure in Telugu, mapping topics to subtopics, with optional English terms in brackets for core concepts to aid comprehension.
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analyze the following Telugu lesson text or study material. Extract the main root topic, important subtopics (aim for 3-6 main branches depending on length), and detailed key concepts/supporting points under each subtopic (3-5 items per subtopic).
Everything in the mind map must be written in neat, elegant, grammatically correct Telugu, with helpful technical/scientific terms in brackets '()' in English where applicable to assist students. Keep all titles and descriptors highly concise (1-5 words maximum per node) so they display beautifully on a visual graph.

Analyze this content:
"""
${content}
"""`,
        config: {
          systemInstruction: "You are a master Telugu school curriculum planner and visually-oriented pedagogy expert. Your goal is to dissect any Telugu notes, text, or academic content and structure it as a clean hierarchical JSON object to be visualized directly as an interactive mind map. Ensure all node text is in neat Telugu.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A unique short string, e.g. 'root'" },
              text: { type: Type.STRING, description: "The central core lesson title in Telugu" },
              children: {
                type: Type.ARRAY,
                description: "Subtopics expanding from the main lesson title",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique identifier key" },
                    text: { type: Type.STRING, description: "The subtopic name in Telugu" },
                    children: {
                      type: Type.ARRAY,
                      description: "Concrete definitions, examples, sub-items, or important facts belonging strictly to this subtopic",
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING, description: "A unique identifier key" },
                          text: { type: Type.STRING, description: "Brief concept point or definition in Telugu" }
                        },
                        required: ["id", "text"]
                      }
                    }
                  },
                  required: ["id", "text"]
                }
              }
            },
            required: ["id", "text", "children"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response received from Gemini AI model.");
      }

      const parsedData = JSON.parse(text.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error generating mind map:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred while analyzing the lesson content." });
    }
  });

  // API Route for generating Telugu interactives quiz from lesson content
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { content, difficulty, questionCount, scopeTitle } = req.body;
      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Content is required for quiz helper analysis." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured. Please configure your API Key in the Secrets panel in AI Studio settings." 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const qCount = parseInt(questionCount, 10) || 5;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following Telugu lesson text or study material. Generate exactly ${qCount} quiz questions based on the content.
The level of difficulty of questions should be: ${difficulty}.
The target topic/scope is: ${scopeTitle || "Entire Lesson"}.

Generate a mix of these question types:
- Multiple Choice Questions (MCQs): 4 options in Telugu, 1 correct.
- True/False (T/F): 2 options strictly ['నిజం', 'తప్పు'], 1 correct match.
- Fill in the blanks (FITB): A sentence with a blank '________', where the correct answer is 1-3 typed Telugu words maximum.
- One-word questions: A direct question in Telugu, where the correct answer is 1-3 typed Telugu words maximum.

All questions must be written in clear, elegant, grammatically correct and readable Telugu, with English terms in brackets '()' if helpful. Keep any option choices concise. Ensure questions are derived ONLY from the provided text, without introducing outside or generic knowledge. Do not use generic motivational text. Add a concise, helpful hint in Telugu (5-10 words) for each question.

Content to analyze:
"""
${content}
"""`,
        config: {
          systemInstruction: "You are a master Telugu school curriculum planner and quiz designer. Your goal is to dissect Telugu education notes and construct a high-quality, interactive, grammatically flawless JSON quiz based on the requested question count and difficulty level.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                description: "List of generated questions matching the requested questionCount and difficulty",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "A unique identifier (e.g. 'q1', 'q2')" },
                    type: { type: Type.STRING, description: "Must be 'MCQ', 'TF', 'FITB', or 'ONE_WORD'" },
                    questionText: { type: Type.STRING, description: "The content of the question or the blank statement in Telugu" },
                    options: {
                      type: Type.ARRAY,
                      description: "For MCQ, exactly 4 distinct options in Telugu. For TF, exactly ['నిజం', 'తప్పు']. For FITB and ONE_WORD, you can leave it empty or provide 4 choices to make it multiple choice.",
                      items: { type: Type.STRING }
                    },
                    correctAnswer: { type: Type.STRING, description: "The exact correct answer (must match one of the options if options are present, e.g. for TF it is either 'నిజం' or 'తప్పు')" },
                    hint: { type: Type.STRING, description: "A helpful, concise hint in Telugu to guide the student of about 5-10 words" }
                  },
                  required: ["id", "type", "questionText", "correctAnswer"]
                }
              }
            },
            required: ["quizTitle", "questions"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response received from Gemini AI model.");
      }

      res.json(JSON.parse(text.trim()));
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred while compiling the interactive study quiz." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
