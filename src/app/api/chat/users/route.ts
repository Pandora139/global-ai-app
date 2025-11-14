import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/users
 * Crea o recupera un usuario según su email o nombre
 * Body esperado: { name: string, email?: string }
 */
export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name && !email) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos un nombre o correo electrónico." },
        { status: 400 }
      );
    }

    // 🔍 Verificar si el usuario ya existe
    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email || ""},name.eq.${name || ""}`)
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingUser) {
      console.log("✅ Usuario existente encontrado:", existingUser.id);
      return NextResponse.json({
        message: "Usuario existente.",
        user: existingUser,
      });
    }

    // 🧠 Crear nuevo usuario
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ name, email }])
      .select()
      .single();

    if (insertError) throw insertError;

    console.log("👤 Nuevo usuario creado:", newUser.id);

    return NextResponse.json({
      message: "Usuario creado correctamente.",
      user: newUser,
    });
  } catch (err: any) {
    console.error("❌ Error en /api/users:", err);
    return NextResponse.json(
      { error: err.message || "Error interno del servidor." },
      { status: 500 }
    );
  }
}
