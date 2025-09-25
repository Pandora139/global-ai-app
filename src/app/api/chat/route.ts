import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // 🔹 1. Leer el body crudo
    const rawBody = await req.text();
    console.log("Raw body recibido en /api/chat:", rawBody);

    // 🔹 2. Parsear el body
    const body = JSON.parse(rawBody || "{}");
    console.log("📥 Parsed body en /api/chat:", body);

    const { messages, tipo } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Formato inválido de mensajes" },
        { status: 400 }
      );
    }

    // 🔹 3. Construir los mensajes para OpenAI
    const finalMessages = [
      {
        role: "system",
        content: `Eres un experto en ${tipo || "temas generales"}. Responde de forma clara y útil.`,
      },
      ...messages,
    ];

    console.log("🧾 Mensajes que se enviarán a OpenAI:", finalMessages);

    // 🔹 4. Llamar al modelo
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: finalMessages,
    });

    const reply = completion.choices[0].message?.content || "No tengo respuesta.";

    console.log("✅ Respuesta de OpenAI:", reply);

    // 🔹 5. Responder al frontend
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("❌ Error en /api/chat:", error);
    return NextResponse.json(
      { error: "Error procesando la solicitud" },
      { status: 500 }
    );
  }
}
