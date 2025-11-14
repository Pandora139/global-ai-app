"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Project = {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at?: string | null;
  type?: string;
};

type Question = {
  id: string;
  question: string;
  help_text?: string;
};

type AnswersMap = Record<string, string>;

// IDs confirmados
const SUBEXPERT_CREACION_PRODUCTO_ID = "be9bf300-2240-45fe-9121-a044df4e5166";
const SUBEXPERT_CREACION_SERVICIO_ID = "c96ddfcd-62c9-45f9-baef-099f4dd07305";

export default function ProductsPanel() {
  // 🧠 Sesión del usuario
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 📦 Productos
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [lastCreatedProjectId, setLastCreatedProjectId] = useState<string | null>(null);

  // 📋 Preguntas dinámicas
  const [productType, setProductType] = useState<"fisico" | "servicio" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [helpVisible, setHelpVisible] = useState<string | null>(null);

  // ⚙️ Estado de ejecución IA
  const [executing, setExecuting] = useState(false);
  const [autoReply, setAutoReply] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // 🧍 Usuario actual
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email ?? null);
      }
    };
    run();
  }, []);

  // 📥 Cargar productos existentes
  useEffect(() => {
    if (!userId) return;
    const loadProjects = async () => {
      try {
        const res = await fetch(`/api/chat/projects?user_id=${userId}`);
        const data = await res.json();
        if (!data?.error) {
          setProjects(data);
          localStorage.setItem("userProjects", JSON.stringify(data));
        }
      } catch (err) {
        console.error("❌ Error cargando productos:", err);
      } finally {
        setLoadingProjects(false);
      }
    };
    loadProjects();
  }, [userId]);

  // 📋 Cargar preguntas desde Supabase
  const loadQuestions = async (type: "fisico" | "servicio") => {
    const table =
      type === "fisico" ? "product_questions_fisico" : "product_questions_servicio";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setQuestions(data);
      setAnswers({});
    } else {
      console.error("❌ Error cargando preguntas:", error);
    }
  };

  // 🧠 Construir resumen
  const buildResumen = () => {
    return questions
      .map((q) => `${q.question}: ${answers[q.id] || "(sin respuesta)"}`)
      .join("\n");
  };

  // 🧩 Cambiar respuesta
  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const toggleHelp = (id: string) => {
    setHelpVisible((prev) => (prev === id ? null : id));
  };

  // 🚀 Crear + Ejecutar producto con IA
  const handleCreateAndExecute = async () => {
    if (!userId || !productType) return alert("Selecciona tipo de producto.");

    const resumen = buildResumen();
    const nombre = answers[questions[0]?.id] || "Producto sin nombre";
    const descripcion =
      productType === "fisico"
        ? "Producto físico generado automáticamente"
        : "Servicio generado automáticamente";

    setExecuting(true);
    setAutoReply(null);
    setProgressStage(0);
    setProgressPercent(5);

    try {
      const subExpertId =
        productType === "fisico"
          ? SUBEXPERT_CREACION_PRODUCTO_ID
          : SUBEXPERT_CREACION_SERVICIO_ID;

      // 🔹 Crear proyecto
      const res = await fetch("/api/chat/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: nombre,
          description: descripcion,
          sub_expert_id: subExpertId,
          type: productType === "fisico" ? "producto_fisico" : "curso_servicio",
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const project_id = data.project.id;
      setLastCreatedProjectId(project_id);

      // 🔄 Progreso visual
      const interval = setInterval(() => {
        setProgressPercent((p) => (p < 85 ? p + 1 : p));
      }, 300);
      setProgressStage(1);

      const exec = await fetch("/api/chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id,
          sub_expert_id: subExpertId,
          resumen,
          answers,
        }),
      });

      const execData = await exec.json();
      clearInterval(interval);
      setProgressStage(3);
      setProgressPercent(100);

      if (!exec.ok) throw new Error(execData.error || "Error desconocido");
      setAutoReply(execData.reply);

      // ✅ Guardar producto local + establecer proyecto activo
      const newProject = {
        id: project_id,
        name: nombre,
        title: nombre,
        description: descripcion,
        type: productType === "fisico" ? "producto_fisico" : "curso_servicio",
      };

      try {
        // Guardar en lista local
        const prev = JSON.parse(localStorage.getItem("userProjects") || "[]");
        const updated = [...prev.filter((p: any) => p.id !== project_id), newProject];
        localStorage.setItem("userProjects", JSON.stringify(updated));
        setProjects(updated);

        // ✅ Guardar como activo
        localStorage.setItem("activeProject", JSON.stringify(newProject));
        window.dispatchEvent(new Event("storage")); // 🔁 Notifica a otros paneles que el proyecto activo cambió
        console.log("✅ Proyecto activo establecido:", newProject);
      } catch (err) {
        console.error("❌ Error guardando en localStorage:", err);
      }

      alert(`✅ Producto creado y activado: ${nombre}`);
    } catch (err) {
      console.error("❌ Error al crear o ejecutar:", err);
      alert("Error al crear o ejecutar el producto.");
    } finally {
      setExecuting(false);
    }
  };

  // 🔸 Activar producto existente
  const handleSelectExisting = (project: Project) => {
    try {
      localStorage.setItem(
        "activeProject",
        JSON.stringify({
          id: project.id,
          name: project.title,
          type: project.type,
        })
      );
      window.dispatchEvent(new Event("storage")); // 🔁 Sincroniza cambio con otros componentes
      alert(`✅ Proyecto activo: ${project.title}`);
    } catch (err) {
      console.error("❌ Error al activar producto existente:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* 🔹 Cabecera */}
      <div className="card-dark p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-bold text-blue-400">Mis Productos NEXUS</h2>
          {userEmail && <span className="text-xs text-gray-400">Sesión: {userEmail}</span>}
        </div>
      </div>

      {/* 🔹 Creación guiada */}
      <div className="card-dark p-6">
        <h3 className="text-xl font-semibold text-blue-300 mb-4">Creación guiada</h3>

        {/* Selección tipo */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              productType === "fisico"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
            }`}
            onClick={() => {
              setProductType("fisico");
              loadQuestions("fisico");
            }}
          >
            🧱 Producto físico
          </button>
          <button
            className={`px-4 py-2 rounded-lg border text-sm font-medium ${
              productType === "servicio"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
            }`}
            onClick={() => {
              setProductType("servicio");
              loadQuestions("servicio");
            }}
          >
            🎓 Curso / Servicio
          </button>
        </div>

        {/* Preguntas dinámicas */}
        {productType && questions.length > 0 && (
          <div className="space-y-5">
            {questions.map((q) => (
              <div key={q.id}>
                <div className="flex items-start gap-2 mb-2">
                  <label className="text-gray-200 text-sm font-medium flex-1">
                    {q.question}
                  </label>

                  <div className="relative">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-blue-600 text-white rounded cursor-pointer select-none"
                      onClick={() => toggleHelp(q.id)}
                      title={q.help_text || ""}
                    >
                      💡
                    </span>
                    {helpVisible === q.id && (
                      <div className="absolute z-20 top-6 right-0 w-64 text-xs bg-gray-900 border border-blue-500/40 text-gray-200 p-3 rounded-lg shadow-xl">
                        {q.help_text || "Sin sugerencia definida"}
                      </div>
                    )}
                  </div>
                </div>

                <input
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}

            <div className="mt-6">
              <button
                disabled={executing}
                onClick={handleCreateAndExecute}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  executing
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {executing ? "⚙️ Ejecutando..." : "⚡ Crear y ejecutar producto"}
              </button>
            </div>
          </div>
        )}

        {/* 🔹 Progreso */}
        {executing && (
          <div className="flex flex-col items-center text-center mt-8 mb-6">
            <p className="text-blue-300 font-medium mb-4 animate-pulse">
              🧠{" "}
              {progressStage === 0
                ? "Analizando respuestas..."
                : progressStage === 1
                ? "Construyendo prompt..."
                : progressStage === 2
                ? "Generando propuesta profesional..."
                : progressStage === 3
                ? "Finalizando..."
                : "Completado ✅"}
            </p>

            <div className="relative w-2/3 h-3 bg-gray-900 rounded-full overflow-hidden mb-3 border border-blue-700/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-600 transition-[width] duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <p className="text-sm text-cyan-300 font-medium tracking-wide">
              {progressPercent < 100
                ? `${progressPercent.toFixed(0)}% completado`
                : "✅ Resultado listo"}
            </p>
          </div>
        )}

        {/* Resultado */}
        {autoReply && (
          <div className="mt-8 card-dark p-5 border border-gray-700 rounded-xl shadow-md max-h-[400px] overflow-y-auto">
            <h4 className="text-lg font-semibold text-blue-300 mb-3">
              🧠 Propuesta generada automáticamente
            </h4>
            <div className="prose prose-invert text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
              {autoReply}
            </div>
          </div>
        )}
      </div>

      {/* 🔹 Productos existentes */}
      <div className="card-dark p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-4">Productos existentes</h3>
        {loadingProjects ? (
          <p className="text-gray-400">Cargando…</p>
        ) : projects.length ? (
          <div className="grid md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectExisting(p)}
                className="text-left bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl p-4 transition"
              >
                <div className="font-semibold text-blue-400">{p.title}</div>
                <div className="text-sm text-gray-300 line-clamp-2">
                  {p.description || "Sin descripción"}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">Aún no tienes productos.</p>
        )}
      </div>
    </div>
  );
}
