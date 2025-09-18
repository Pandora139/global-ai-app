import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRecommendation(userResponses: any) {
  try {
    const prompt = `
      Eres un consejero de carreras en Colombia. Analiza las siguientes respuestas de un cuestionario para sugerir 3 opciones de carrera profesional y por qué son una buena opción para el usuario.
      Respuestas del usuario: ${JSON.stringify(userResponses)}
      
      Formato de respuesta:
      1. Nombre de la carrera: [Nombre]
         Justificación: [Explicación concisa]
      2. Nombre de la carrera: [Nombre]
         Justificación: [Explicación concisa]
      3. Nombre de la carrera: [Nombre]
         Justificación: [Explicación concisa]
    `;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error al generar la recomendación:', error);
    return 'Lo siento, no pude generar una recomendación en este momento.';
  }
}