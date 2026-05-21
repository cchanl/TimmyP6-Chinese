import { QuizQuestion, Difficulty } from "../types";

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const generateQuizQuestions = async (
  words: string[], 
  count: number = 20, 
  difficulty: Difficulty = Difficulty.MEDIUM
): Promise<QuizQuestion[]> => {
  try {
    const response = await fetch("/api/generate-quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        words,
        count,
        difficulty,
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to generate quiz from backend");
    }

    const rawData = await response.json();

    // Shuffle the generated questions so they don't follow the word list order
    const shuffledData = shuffleArray(rawData);

    // Transform to internal type with new sequential IDs
    return shuffledData.map((item: any, index: number) => ({
      id: index + 1,
      sentenceParts: [item.part1, item.part2],
      answer: item.answer,
      explanation: item.explanation,
    }));

  } catch (error: any) {
    console.error("Gemini service client-side proxy error:", error);
    throw new Error(error?.message || "Failed to generate quiz. Please try again.");
  }
};
