import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            success: false,
            error: "Method Not Allowed"
        });

    }

    try {

        const GEMINI_API_KEY =
            process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {

            return res.status(500).json({
                success: false,
                error: "GEMINI_API_KEY not configured"
            });

        }

        const { topic, questionCount = 10 } =
            req.body;

        const genAI =
            new GoogleGenerativeAI(
                GEMINI_API_KEY
            );

        const model =
            genAI.getGenerativeModel({
                model: "gemini-1.5-flash"
            });

        const prompt = `
Generate ${questionCount} multiple-choice questions about ${topic}.

Return ONLY valid JSON in this exact format:

[
  {
    "question": "Question text",
    "options": [
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4"
    ],
    "answer": 0
  }
]

Rules:
- Exactly 4 options.
- "answer" must be 0, 1, 2 or 3.
- No markdown.
- No explanation.
- Return only JSON.
`;

        const result =
            await model.generateContent(
                prompt
            );

        let text =
            result.response.text();

        text = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const questions =
            JSON.parse(text);

        return res.status(200).json({
            success: true,
            questions
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message
        });

    }

}