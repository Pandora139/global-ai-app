// src/app/api/chat/send/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { subExpertId, message } = await req.json();

    if (!subExpertId || !message) {
      return NextResponse.json({ error: "Faltan parámetros: subExpertId o message" }, { status: 400 });
    }

    // 🔹 Buscar el sub-experto en Supabase
    const { data: subExpert, error } = await supabase
      .from("sub_experts")
      .select("prompt_base, title")
      .eq("id", subExpertId)
      .single();

    if (error || !subExpert) {
      return NextResponse.json({ error: "Sub-experto no encontrado" }, { status: 404 });
    }

    const systemPrompt =
      subExpert.prompt_base ||
      `Eres un experto en ${subExpert.title}. Ayuda al usuario con respuestas útiles y concisas.`;

    // 🔹 Enviar el mensaje a OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Puedes cambiar a gpt-4o o gpt-3.5-turbo según tu plan
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || "No tengo una respuesta en este momento.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("❌ Error en /api/chat/send:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
