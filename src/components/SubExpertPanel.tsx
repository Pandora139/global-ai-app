"use client";

import { useEffect, useState } from "react";

export default function SubExpertPanel({ subExpert, activeProject }: any) {
  const [mode, setMode] = useState<"nexus" | "external" | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState<string | null>(null);

  // ✅ Cargar productos Nexus del usuario
  useEffect(() => {
    async function fetchProducts() {
      try {
        const user_id = localStorage.getItem("user_id");
        if (!user_id) return;
        const res = await fetch(`/api/chat/projects?user_id=${user_id}`);
        const data = await res.json();
        setProducts(data || []);
      } catch (err) {
        console.error("❌ Error al cargar productos:", err);
      }
    }
    fetchProducts();
  }, []);

  // 🧠 Ejecutar prompt con producto o respuestas
  const handleExecute = async () => {
    try {
      setLoading(true);
      setAutoReply(null);

      let resumen = "";

      if (mode === "nexus" && selectedProduct) {
        resumen = `Producto seleccionado: ${selectedProduct.title} — ${selectedProduct.description || "Sin descripción"}`;
      } else if (mode === "external") {
        resumen = Object.entries(answers)
          .map(([q, a]) => `${q}: ${a}`)
          .join("\n");
      } else {
        alert("Debes seleccionar un modo o producto válido.");
        return;
      }

      const res = await fetch("/api/chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: selectedProduct?.id || activeProject?.id,
          sub_expert_id: subExpert.id,
          resumen,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en ejecución");
      setAutoReply(data.reply);
    } catch (err) {
      console.error("❌ Error al ejecutar:", err);
      alert("Error al ejecutar el desarrollo del subexperto.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Preguntas básicas (estas luego se cargarán desde Supabase)
  const baseQuestions = [
    { q: "¿Cuál es el nombre del producto?", h: "Ingresa un nombre tentativo o provisional." },
    { q: "¿Qué problema o deseo principal vas a resolver?", h: "Describe la necesidad o el problema central." },
    { q: "¿De qué material estará hecho o cómo se fabrica?", h: "Indica materiales o proceso productivo." },
    { q: "¿Cuál es el precio estimado?", h: "Define un rango o valor aproximado." },
    { q: "¿Cómo será el empaque o presentación?", h: "Ejemplo: caja, bolsa, frasco, etc." },
    { q: "¿Dónde se venderá inicialmente?", h: "Especifica canales o regiones." },
    { q: "¿Qué canales de distribución se usarán?", h: "Por ejemplo: e-commerce, distribuidores, tiendas." },
    { q: "¿Qué meta de ventas tienes a corto plazo?", h: "Ejemplo: vender 100 unidades en 3 meses." },
  ];

  return (
    <div className="p-6 bg-[#0c0e12] rounded-xl border border-gray-800 shadow-md">
      <h1 className="text-2xl font-bold text-blue-400 mb-3">{subExpert.title}</h1>
      <p className="text-gray-400 mb-6">{subExpert.description}</p>

      {!mode && (
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-gray-300 font-medium mb-2">
            ¿Cómo deseas trabajar en este submenú?
          </h3>
          <div className="flex gap-4">
            <button
              className="btn-primary"
              onClick={() => setMode("nexus")}
            >
              🧩 Usar producto Nexus existente
            </button>
            <button
              className="btn-secondary"
              onClick={() => setMode("external")}
            >
              ✏️ Crear producto externo
            </button>
          </div>
        </div>
      )}

      {mode === "nexus" && (
        <div className="mt-6">
          <h3 className="text-lg text-blue-300 mb-2">Selecciona un producto existente:</h3>
          <select
            className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-200"
            onChange={(e) =>
              setSelectedProduct(products.find((p) => p.id === e.target.value))
            }
          >
            <option value="">-- Selecciona un producto --</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleExecute}
            disabled={!selectedProduct || loading}
            className="btn-primary mt-4"
          >
            {loading ? "⚙️ Ejecutando..." : "⚡ Ejecutar prompt del submenú"}
          </button>
        </div>
      )}

      {mode === "external" && (
        <div className="mt-6 space-y-4">
          {baseQuestions.map((item, idx) => (
            <div key={idx}>
              <label className="block text-gray-300 mb-1">{item.q}</label>
              <input
                type="text"
                placeholder={item.h}
                className="w-full p-2 rounded bg-gray-900 border border-gray-700 text-gray-200"
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [item.q]: e.target.value }))
                }
              />
            </div>
          ))}

          <button
            onClick={handleExecute}
            disabled={loading}
            className="btn-primary mt-4"
          >
            {loading ? "⚙️ Ejecutando..." : "⚡ Ejecutar prompt"}
          </button>
        </div>
      )}

      {autoReply && (
        <div className="mt-6 p-4 border border-gray-700 rounded-lg bg-[#111317]">
          <h2 className="text-blue-300 font-semibold mb-2">🧠 Respuesta generada</h2>
          <pre className="text-gray-300 whitespace-pre-wrap">{autoReply}</pre>
        </div>
      )}
    </div>
  );
}
