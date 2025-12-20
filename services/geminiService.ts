import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const generateQuizQuestions = async (words: string[], count: number = 20): Promise<QuizQuestion[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Act as a professional primary school Chinese teacher.
    
    Task: Design a fill-in-the-blank vocabulary quiz.
    Target Audience: 6th-grade students (approx. 11-12 years old).
    
    Requirements:
    1. Use the following list of words: ${words.join(", ")}.
    2. Generate exactly ${count} questions. 
       - If there are fewer words than questions, you MUST reuse words to reach exactly ${count} questions.
       - If there are more words than questions, select the most appropriate ones, but prioritize using as many unique words from the list as possible.
    3. Context: Daily life scenarios or student experiences.
    4. Difficulty: Moderate (Grade 6 level).
    5. Output Format: A JSON array.
    6. For each question, provide a brief explanation (in Traditional Chinese) suitable for a 6th grader. The explanation should clarify why the answer is correct based on the context or meaning of the word.
    
    The sentence should be split into two parts: 'before' the blank and 'after' the blank.
    The 'answer' must be one of the words from the provided list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

    const rawData = JSON.parse(response.text || "[]");

    // Shuffle the generated questions so they don't follow the word list order
    const shuffledData = shuffleArray(rawData);

    // Transform to internal type with new sequential IDs
    return shuffledData.map((item: any, index: number) => ({
      id: index + 1,
      sentenceParts: [item.part1, item.part2],
      answer: item.answer,
      explanation: item.explanation,
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
};