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

export async function generateQuestions(existingQuestions: string[]) {
  const prompt = `
  Genera 5 preguntas nuevas de opción múltiple sobre orientación vocacional,
  diferentes a estas: ${existingQuestions.join(", ")}.
  Devuélvelas en formato JSON como un array de objetos:
  [
    { "id": "unique-id", "text": "texto de la pregunta", "options": ["opción1", "opción2", "opción3"] }
  ]
  `;

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const text = completion.choices[0].message?.content ?? "[]";
    return JSON.parse(text);
  } catch {
    return [];
  }
}
