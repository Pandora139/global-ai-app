import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 🔹 GET /api/chat/projects?user_id=uuid
 * Obtiene los proyectos del usuario
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get("user_id");

  if (!user_id) {
    return NextResponse.json(
      { error: "Falta el parámetro user_id" },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("❌ Error en GET /api/chat/projects:", err);
    return NextResponse.json(
      { error: err.message || "Error al obtener proyectos" },
      { status: 500 }
    );
  }
}

/**
 * 🔹 POST /api/chat/projects
 * Crea un nuevo proyecto para un usuario
 * Body esperado: { user_id: string, name: string, description?: string }
 */
export async function POST(req: Request) {
  try {
    const { user_id, name, description } = await req.json();

    if (!user_id || !name) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: user_id o name" },
        { status: 400 }
      );
    }

    // 🟡 Agregamos logs para depurar
    console.log("📨 Recibiendo solicitud POST /api/chat/projects:");
    console.log("   → user_id:", user_id);
    console.log("   → name:", name);
    console.log("   → description:", description);

    const { data, error } = await supabase
      .from("projects")
      .insert([{ user_id, title: name, description }])
      .select()
      .single();

    if (error) {
      console.error("❌ Error Supabase al insertar proyecto:", error);
      throw error;
    }

    console.log("✅ Proyecto creado correctamente:", data);

    return NextResponse.json({
      message: "Proyecto creado correctamente.",
      project: data,
    });
  } catch (err: any) {
    console.error("❌ Error en POST /api/chat/projects:", err);
    return NextResponse.json(
      { error: err.message || "Error al crear el proyecto" },
      { status: 500 }
    );
  }
}
