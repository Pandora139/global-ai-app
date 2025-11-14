import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * ✅ Endpoint: /api/chat/sub_experts?expert_id=<uuid>
 * Devuelve los sub-expertos de un experto, incluyendo prompt_base y estado.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const expert_id = searchParams.get("expert_id");

    if (!expert_id) {
      return NextResponse.json(
        { error: "Falta el parámetro 'expert_id' en la URL" },
        { status: 400 }
      );
    }

    // 🧠 Cargamos todos los sub-expertos activos del experto seleccionado
    const { data, error } = await supabase
      .from("sub_experts")
      .select("id, title, description, expert_id, prompt_base, is_active")
      .eq("expert_id", expert_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error al obtener sub-expertos:", error.message);
      return NextResponse.json(
        { error: "Error al obtener sub-expertos" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: `No se encontraron sub-expertos para el experto ${expert_id}` },
        { status: 404 }
      );
    }

    console.log(`✅ ${data.length} sub-expertos encontrados para expert_id: ${expert_id}`);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Error en GET /api/chat/sub_experts:", err.message);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
