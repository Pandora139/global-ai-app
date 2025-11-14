"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type QuestionRow = { id: string; question: string; help_text: string | null };

export default function NexusContentPanel({
  expert,
  subExpert,
}: {
  expert: any;
  subExpert: any;
}) {
  const router = useRouter();

  // ------------------ estado base ------------------
  const [activeProject, setActiveProject] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answersForm, setAnswersForm] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"existing" | "external">("existing");
  const [loadingInit, setLoadingInit] = useState(true);

  const [loading, setLoading] = useState(false);
  const [autoReply, setAutoReply] = useState<string | null>(null);
  const [progressStage, setProgressStage] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const [currentUser, setCurrentUser] = useState<any>(null);

  // ------------------ helpers ------------------
 const persistActiveProject = (proj: any | null) => {
  if (!proj) return;
  const normalized = {
    id: proj.id,
    name: proj.name || proj.title || "Proyecto sin nombre",
    type: proj.type || "producto_fisico",
  };
  setActiveProject(normalized);
  localStorage.setItem("activeProject", JSON.stringify(normalized));
  window.dispatchEvent(new Event("storage")); // 🔁 fuerza actualización global
};


  const readAllFromLocalStorage = () => {
    try {
      const storedActive = localStorage.getItem("activeProject");
      const storedAll = localStorage.getItem("userProjects");

      if (storedActive) setActiveProject(JSON.parse(storedActive));
      if (storedAll) {
        const parsed = JSON.parse(storedAll);
        if (Array.isArray(parsed)) setUserProjects(parsed);
      }
    } catch {
      setActiveProject(null);
      setUserProjects([]);
    }
  };

  // ------------------ 1) sesión ------------------
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };
    run();
  }, []);

  // ------------------ 2) cargar LS al montar y escuchar cambios ------------------
  useEffect(() => {
    readAllFromLocalStorage();

    // cuando otro componente (ProductsPanel) cambia el activeProject,
    // capturamos el cambio
    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeProject" || e.key === "userProjects") {
        readAllFromLocalStorage();
      }
    };
    window.addEventListener("storage", onStorage);

    // refrescar al volver a la pestaña (por si cambió en otra)
    const onFocus = () => readAllFromLocalStorage();
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // ------------------ 3) preguntas por subexperto ------------------
  useEffect(() => {
    const load = async () => {
      try {
        const realSubExpertId =
          activeProject?.type === "curso_servicio"
            ? "c96ddfcd-62c9-45f9-baef-099f4dd07305"
            : subExpert?.id;

        if (!realSubExpertId) {
          setQuestions([]);
          setLoadingInit(false);
          return;
        }

        const { data, error } = await supabase
          .from("sub_expert_questions")
          .select("id, question, help_text, is_active, order_index")
          .eq("sub_expert_id", realSubExpertId)
          .eq("is_active", true)
          .order("order_index", { ascending: true });

        if (error) console.error("❌ Error cargando preguntas:", error);

        const normalized: QuestionRow[] =
          data?.map((q: any) => ({
            id: q.id,
            question: q.question ?? "",
            help_text: q.help_text ?? null,
          })) || [];

        setQuestions(normalized);

        const init: Record<string, string> = {};
        normalized.forEach((q) => (init[q.id] = ""));
        setAnswersForm(init);
      } catch (e) {
        console.error("❌ Error preparando datos:", e);
      } finally {
        setLoadingInit(false);
      }
    };

    load();
  }, [subExpert?.id, activeProject?.type]);

  // ------------------ 4) respuestas ------------------
  const handleAnswerChange = (qid: string, value: string) => {
    setAnswersForm((prev) => ({ ...prev, [qid]: value }));
  };

  // ------------------ 5) generar/ejecutar y guardar historial ------------------
  const handleGenerate = async () => {
    if (!subExpert?.id) {
      alert("Error: no hay subexperto seleccionado.");
      return;
    }

    setLoading(true);
    setProgressStage(0);
    setProgressPercent(5);
    setAutoReply(null);

    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgressStage(1);
      setProgressPercent(20);

      const effectiveSubExpertId =
        activeProject?.type === "curso_servicio"
          ? "c96ddfcd-62c9-45f9-baef-099f4dd07305"
          : subExpert.id;

      const payload: any = { sub_expert_id: effectiveSubExpertId };

      // nombre de proyecto para historial
      let projectNameForHistory = "Producto externo";

      if (mode === "existing") {
        if (!selectedProjectId) {
          alert("Selecciona un producto existente de NEXUS.");
          setLoading(false);
          return;
        }

        payload.project_id = selectedProjectId;

        const found = userProjects.find((p) => p.id === selectedProjectId);
        if (found) {
          projectNameForHistory = found.name || found.title || "Producto";
          // ✅ al elegir existente: actualizar proyecto activo
          persistActiveProject({
            id: found.id,
            name: projectNameForHistory,
            type: found.type || "producto_fisico",
          });
        }
      } else {
        payload.answers = answersForm;
      }
// ✅ Si el modo es externo, marcamos producto externo como activo
persistActiveProject({
  id: "external-" + Date.now(),
  name: "Producto externo",
  type: "externo",
});

      const interval = setInterval(() => {
        setProgressPercent((p) => (p < 85 ? p + 1 : p));
      }, 300);

      setProgressStage(2);
      const res = await fetch("/api/chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const execData = await res.json(); // 🔧 usa execData, NO "data"
      clearInterval(interval);

      setProgressStage(3);
      setProgressPercent(100);
      setAutoReply(execData?.reply || "(sin respuesta)");

      // ✅ Guardar historial (local + Supabase)
try {
  // obtener usuario actual para asociarlo en Supabase
  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData?.user?.id || null;

  // nombre final del proyecto
  const finalProjectName =
    projectNameForHistory ||
    activeProject?.name ||
    (mode === "external" ? "Producto externo" : "Sin nombre");

  const entry = {
    id: crypto.randomUUID(),
    user_id,
    project_id: mode === "existing" ? selectedProjectId : null,
    project_name: finalProjectName,
    sub_expert_title: subExpert?.title || "Subexperto",
    date: new Date().toISOString(),
    content: execData?.reply || "(sin contenido)",
    is_archived: false,
  };

  // Guardar en localStorage (respaldo)
  const stored = JSON.parse(localStorage.getItem("nexusHistory") || "[]");
  localStorage.setItem("nexusHistory", JSON.stringify([entry, ...stored]));

  // Guardar en Supabase
  const { error } = await supabase.from("user_history").insert([entry]);
  if (error) {
    console.warn("⚠️ Error guardando en Supabase:", error.message);
  } else {
    console.log("✅ Historial guardado en Supabase correctamente");
  }

  // 🔁 Notificar al historial que hay un nuevo registro
  window.dispatchEvent(new Event("storage"));
} catch (e) {
  console.error("❌ Error guardando historial:", e);
}


      setTimeout(() => {
        setProgressStage(4);
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error("❌ Error al generar:", err);
      alert("Error al generar el resultado.");
      setLoading(false);
    }
  };

  // ------------------ feedback sonoro ------------------
  useEffect(() => {
    if (progressStage === 4) {
      if ("vibrate" in navigator) navigator.vibrate(100);
      const sound = new Audio("/success.mp3");
      sound.volume = 0.3;
      sound.play().catch(() => {});
    }
  }, [progressStage]);

  // ------------------ render ------------------
  if (!expert && !subExpert) {
    return (
      <main className="nexus-content text-center mt-10">
        <h1 className="text-3xl font-bold text-green-400 mb-2">🚀 Bienvenido a NEXUS</h1>
        <p className="text-gray-300">Selecciona un módulo o crea un nuevo producto para comenzar.</p>
      </main>
    );
  }

  const isCreacionDeProducto =
    subExpert?.title?.trim().toLowerCase() === "creación de producto" ||
    subExpert?.title?.trim().toLowerCase() === "creacion de producto";

  if (isCreacionDeProducto) {
    const ProductsPanel = require("@/components/ProductsPanel").default;
    return (
      <main className="nexus-content">
        <ProductsPanel />
      </main>
    );
  }

  return (
    <main className="nexus-content">
      {(currentUser || activeProject) && (
        <div className="flex justify-between items-center mb-6 text-sm text-gray-400">
          <div>
            <span className="font-semibold text-blue-400">Usuario activo:</span>{" "}
            {currentUser?.email || "Invitado"}
          </div>
          <div>
            <span className="font-semibold text-gray-400">Proyecto actual:</span>{" "}
            {activeProject?.name || "Sin proyecto"}
          </div>
        </div>
      )}

      <div className="card-dark p-6 border border-gray-700 rounded-xl shadow-lg max-w-4xl">
        <h1 className="text-2xl font-bold text-blue-400 mb-2">
          {subExpert?.title || "Subexperto"}
        </h1>
        {subExpert?.description && (
          <p className="text-gray-300 mb-6">{subExpert.description}</p>
        )}

        {/* modo */}
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold text-gray-200">¿Con qué producto quieres trabajar?</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-700">
              <input type="radio" className="mt-1" checked={mode === "existing"} onChange={() => setMode("existing")} />
              <div>
                <div className="text-white font-medium">Usar producto existente de NEXUS</div>
                <div className="text-xs text-gray-400">Usa información guardada en tus productos anteriores.</div>
              </div>
            </label>
            <label className="flex items-start gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-700">
              <input type="radio" className="mt-1" checked={mode === "external"} onChange={() => setMode("external")} />
              <div>
                <div className="text-white font-medium">Crear producto externo rápido</div>
                <div className="text-xs text-gray-400">Respóndeme unas preguntas para trabajar con un producto nuevo.</div>
              </div>
            </label>
          </div>
        </div>

        {/* selector proyecto existente */}
        {mode === "existing" && (
          <div className="mb-6">
            <p className="text-sm text-gray-200 font-medium mb-2">Selecciona tu producto:</p>
            {userProjects.length === 0 ? (
              <div className="text-gray-500 text-sm italic bg-gray-800 border border-gray-700 rounded-lg p-4">
                No se encontraron productos guardados aún.
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => {
  const val = e.target.value;
  setSelectedProjectId(val);

  const found = userProjects.find((p) => p.id === val);
  if (found) {
    const newActive = {
      id: found.id,
      name: found.name || found.title || "Producto",
      type: found.type || "producto_fisico",
    };
    persistActiveProject(newActive);
    console.log("✅ Proyecto activo desde subexperto:", newActive);
  }
}}

                className="w-full bg-gray-900 border border-gray-700 rounded-lg text-white text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un producto...</option>
                {userProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.name || p.title || "(sin título)")} — {p.description || "Sin descripción"}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* preguntas dinámicas */}
        {mode === "external" && (
          <div className="mb-6">
            <p className="text-sm text-gray-200 font-medium mb-3">Responde estas preguntas:</p>
            {questions.length === 0 ? (
              <div className="text-gray-500 text-sm italic bg-gray-800 border border-gray-700 rounded-lg p-4">
                (Este subexperto aún no tiene preguntas configuradas)
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="w-full">
                    <div className="flex items-start justify-between mb-1">
                      <label className="text-sm text-gray-200 font-medium pr-2">{q.question}</label>
                      {q.help_text && (
                        <div className="group relative">
                          <button className="text-xs bg-blue-600 rounded px-2 py-[2px] font-semibold shadow hover:bg-blue-500" title={q.help_text}>
                            ?
                          </button>
                          <span className="absolute right-0 bottom-full mb-1 hidden group-hover:block w-48 text-xs bg-gray-800 text-gray-200 p-2 rounded-lg shadow-lg border border-gray-700">
                            {q.help_text}
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg text-white text-sm p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={answersForm[q.id] || ""}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* botones */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => router.push(`/chat/${subExpert.id}?project=${activeProject?.id || "active"}`)}
            className="btn-secondary"
          >
            💬 Abrir Chat
          </button>

          <button onClick={handleGenerate} className="btn-primary">
            ⚡ Generar ahora
          </button>
        </div>

        {/* progreso */}
        {loading && (
          <div className="flex flex-col items-center text-center mt-8 mb-6">
            <p className="text-blue-300 font-medium mb-4 animate-pulse">
              🧠{" "}
              {progressStage === 0
                ? "Analizando tus respuestas..."
                : progressStage === 1
                ? "Construyendo prompt inteligente..."
                : progressStage === 2
                ? "Generando resultado profesional..."
                : progressStage === 3
                ? "Finalizando..."
                : "Completado ✅"}
            </p>
            <div className="relative w-2/3 h-3 bg-gray-900 rounded-full overflow-hidden mb-3 border border-blue-700/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-600 transition-[width] duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-cyan-300 font-medium tracking-wide">
              {progressPercent < 100 ? `${progressPercent.toFixed(0)}% completado` : "✅ Resultado listo"}
            </p>
          </div>
        )}

        {/* resultado */}
        {autoReply && (
          <div className="card-dark p-5 mt-4 border border-gray-700 rounded-xl shadow-md max-h-[500px] overflow-y-auto">
            <h2 className="text-lg font-semibold text-blue-300 mb-3 sticky top-0 bg-[#111317] py-2 border-b border-gray-700">
              🧠 Resultado automático
            </h2>
            <div className="prose text-gray-300 whitespace-pre-wrap leading-relaxed">{autoReply}</div>
          </div>
        )}
      </div>
    </main>
  );
}
