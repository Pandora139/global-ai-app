// src/lib/openaiClient.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateRecommendation(userResponses: { question: string; answer: string }[]) {
  const prompt = `
  Basado en las siguientes respuestas del cuestionario, genera una recomendación de carrera profesional:
  
  ${userResponses.map(r => `Pregunta: ${r.question}\nRespuesta: ${r.answer}`).join("\n\n")}
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Eres un orientador vocacional experto." },
      { role: "user", content: prompt }
    ],
  });

  return response.choices[0].message?.content ?? "No se pudo generar recomendación.";
}
