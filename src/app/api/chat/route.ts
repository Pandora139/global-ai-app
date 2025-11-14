// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("📥 /api/chat body:", JSON.stringify(body));

    const { system_prompt = "", messages = [] } = body as {
      system_prompt?: string;
      messages?: Array<{ role?: string; content?: string }>;
    };

    // Validaciones básicas
    if (!system_prompt || typeof system_prompt !== "string") {
      return NextResponse.json({ error: "Missing system_prompt" }, { status: 400 });
    }
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }

    // Normalizar mensajes (eliminar vacíos)
    const safeMessages = messages
      .map((m) => ({ role: (m.role || "user").toLowerCase(), content: (m.content || "").toString() }))
      .filter((m) => m.content && m.content.trim().length > 0);

    // Construir mensajes para OpenAI: primero el system prompt
    const messagesForAI = [
      { role: "system", content: system_prompt },
      ...safeMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    ];

    console.log("🧾 Enviando a OpenAI:", messagesForAI);

    // Llamada a OpenAI (ajusta modelo si lo necesitas)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // si falla, usa "gpt-3.5-turbo"
      messages: messagesForAI,
    });

    const reply = completion?.choices?.[0]?.message?.content ?? "No se obtuvo respuesta de la IA.";
    console.log("✅ Respuesta de OpenAI:", reply);

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("❌ Error en /api/chat:", err);
    return NextResponse.json({ error: err?.message || "Error desconocido" }, { status: 500 });
  }
}
