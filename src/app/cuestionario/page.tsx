"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// ⚡ Configura tu cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CuestionarioPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [opciones, setOpciones] = useState<string[]>([]);
  const [seleccion, setSeleccion] = useState("");

  // 🔹 Cargar opciones desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("options")
        .eq("text", "Que tipo de experto necesitas?")
        .single();

      if (error) {
        console.error("Error cargando opciones:", error);
      } else if (data?.options) {
        setOpciones(data.options);
      }
    };

    fetchData();
  }, []);

  // 🔹 Manejar envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !seleccion) {
      alert("Por favor ingresa tu nombre y selecciona un experto.");
      return;
    }

    // 👉 Redirigir a la página del experto con query params
    router.push(`/experto?nombre=${encodeURIComponent(nombre)}&tipo=${encodeURIComponent(seleccion)}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cuestionario inicial</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block mb-1 font-medium">Tu nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Escribe tu nombre"
          />
        </div>

        {/* Selección de experto */}
        <div>
          <label className="block mb-1 font-medium">Selecciona un experto</label>
          <select
            value={seleccion}
            onChange={(e) => setSeleccion(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">-- Selecciona --</option>
            {opciones.map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Botón */}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continuar
        </button>
      </form>
    </div>
  );
}
