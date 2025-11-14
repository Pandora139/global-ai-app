import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, sub_expert_id, answers } = body;

    if (!sub_expert_id) {
      return NextResponse.json(
        { error: "Falta el sub_expert_id" },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener subexperto (para prompt base y contexto)
    const { data: subExpert, error: subErr } = await supabase
      .from("sub_experts")
      .select("id, title, description, prompt_base")
      .eq("id", sub_expert_id)
      .single();

    if (subErr || !subExpert) {
      console.error("❌ Error sub_expert:", subErr);
      return NextResponse.json(
        { error: "No se encontró el sub_expert especificado." },
        { status: 400 }
      );
    }

    // 2️⃣ Obtener datos del proyecto (si existe)
    let projectSummary = "";
    if (project_id) {
      const { data: project, error: projErr } = await supabase
        .from("projects")
        .select("id, name, title, description")
        .eq("id", project_id)
        .single();

      if (!projErr && project) {
        projectSummary = `Proyecto seleccionado: ${project.title || project.name || "(sin nombre)"}.
Descripción: ${project.description || "N/A"}.`;
      } else {
        console.warn("⚠️ Proyecto no encontrado o con error:", projErr);
      }
    }

    // 3️⃣ Preparar las respuestas del usuario si vienen desde el formulario
    let userResponses = "";
    if (answers && typeof answers === "object") {
      const entries = Object.entries(answers)
        .map(([k, v]) => `- ${v}`)
        .join("\n");
      userResponses = `Respuestas del usuario:\n${entries}`;
    }

    // 4️⃣ Preparar prompt base
    const basePrompt =
      subExpert.prompt_base?.trim() ||
      `Eres un experto en ${subExpert.title}. 
Genera una salida profesional, directa y útil según las respuestas o información del producto.`;

    // 5️⃣ Combinar todo el contexto
    const finalPrompt = `
${basePrompt}

Contexto del subexperto: ${subExpert.description || "N/A"}.

${projectSummary}

${userResponses || "Sin respuestas adicionales."}

Instrucción:
Genera un entregable profesional y accionable basado en esta información.
No describas el proceso, entrega directamente el resultado final estructurado.
`.trim();

    // 6️⃣ Llamar al modelo (OpenAI API)
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: "Actúa como un experto de negocios de NEXUS AI." },
          { role: "user", content: finalPrompt },
        ],
      }),
    });

    const result = await aiResponse.json();
    const reply =
      result?.choices?.[0]?.message?.content?.trim() ||
      "No se pudo generar respuesta válida.";

    // 7️⃣ Guardar historial (opcional)
    const messagesToSave = [
      {
        project_id: project_id || null,
        sub_expert_id,
        role: "user",
        content: finalPrompt,
      },
      {
        project_id: project_id || null,
        sub_expert_id,
        role: "assistant",
        content: reply,
      },
    ];

    const { error: saveErr } = await supabase.from("messages").insert(messagesToSave);
    if (saveErr) console.warn("⚠️ No se pudo guardar en messages:", saveErr);

    // 8️⃣ Devolver respuesta final
    return NextResponse.json({ ok: true, reply });
  } catch (err: any) {
    console.error("❌ Error general en /api/chat/execute:", err);
    return NextResponse.json(
      { error: err.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
