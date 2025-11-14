import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 🟢 GET /api/chat/messages?project_id=uuid&sub_expert_id=uuid
 * Recupera el historial de conversación de un proyecto con un sub-experto
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get("project_id");
  const sub_expert_id = searchParams.get("sub_expert_id");

  if (!project_id || !sub_expert_id) {
    return NextResponse.json(
      { error: "Faltan parámetros: project_id o sub_expert_id" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at") // ✅ usamos role
      .eq("project_id", project_id)
      .eq("sub_expert_id", sub_expert_id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Error en GET /api/chat/messages:", err);
    return NextResponse.json(
      { error: err.message || "Error al obtener los mensajes" },
      { status: 500 }
    );
  }
}

/**
 * 🟣 POST /api/chat/messages
 * Guarda uno o varios mensajes en la conversación de un proyecto
 * Body esperado:
 * {
 *   project_id: string,
 *   sub_expert_id: string,
 *   messages: [{ role: "user" | "assistant", content: string }]
 * }
 */
export async function POST(req: Request) {
  try {
    const { project_id, sub_expert_id, messages } = await req.json();

    if (!project_id || !sub_expert_id || !messages?.length) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (project_id, sub_expert_id, messages)" },
        { status: 400 }
      );
    }

    const rows = messages.map((m: any) => ({
      project_id,
      sub_expert_id,
      role: m.role, // ✅ reemplazo de sender → role
      content: m.content,
    }));

    const { data, error } = await supabase.from("messages").insert(rows).select();

    if (error) throw error;

    return NextResponse.json({
      message: "Mensajes guardados correctamente",
      data,
    });
  } catch (err: any) {
    console.error("❌ Error en POST /api/chat/messages:", err);
    return NextResponse.json(
      { error: err.message || "Error al guardar los mensajes" },
      { status: 500 }
    );
  }
}
