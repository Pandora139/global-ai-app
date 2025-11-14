"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ExpertDashboard() {
  const router = useRouter();
  const [activeProject, setActiveProject] = useState<any>(null);
  const [experts, setExperts] = useState<any[]>([]);
  const [subExperts, setSubExperts] = useState<any[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // 🧠 Cargar proyecto activo
  useEffect(() => {
    const stored = localStorage.getItem("activeProject");
    if (stored) {
      try {
        setActiveProject(JSON.parse(stored));
      } catch {
        setActiveProject(null);
      }
    } else {
      router.push("/projects");
    }
  }, [router]);

  // 📚 Obtener expertos, subexpertos y progreso
  useEffect(() => {
    const fetchData = async () => {
      if (!activeProject) return;

      try {
        const { data: expertsData } = await supabase
          .from("experts")
          .select("id, key, name, description");

        const { data: subsData } = await supabase
          .from("sub_experts")
          .select("id, expert_id, title, description");

        const { data: msgsData } = await supabase
          .from("messages")
          .select("sub_expert_id")
          .eq("project_id", activeProject.id);

        const counts: Record<string, number> = {};
        msgsData?.forEach((m: any) => {
          if (!m.sub_expert_id) return;
          counts[m.sub_expert_id] = (counts[m.sub_expert_id] || 0) + 1;
        });

        setExperts(expertsData || []);
        setSubExperts(subsData || []);
        setProgress(counts);
      } catch (err) {
        console.error("❌ Error al obtener datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeProject]);

  // ⚡ Ejecutar subexperto (usa tus rutas originales)
  const handleExecute = async (subExpertId: string) => {
    if (!activeProject?.id) {
      alert("No hay proyecto activo.");
      return;
    }

console.log("➡️ Enviando a /api/chat/execute:", {
    project_id: activeProject.id,
    sub_expert_id: subExpertId,
  }); // 👈 agrega esto
  
    try {
      const res = await fetch("/api/chat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: activeProject.id,
          sub_expert_id: subExpertId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("❌ Error respuesta:", data);
        throw new Error(data.error || "Error desconocido");
      }

      alert(`✅ Subexperto ejecutado:\n${(data.reply || "").substring(0, 200)}…`);
    } catch (err) {
      console.error("❌ Error al ejecutar subexperto:", err);
      alert("Error al ejecutar el desarrollo del subexperto.");
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 mt-20">Cargando expertos...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-4">
          🧠 Panel de Expertos
        </h1>

        {activeProject && (
          <div className="text-center text-gray-300 mb-8">
            <p className="text-lg">
              Proyecto activo:{" "}
              <span className="text-blue-400 font-semibold">{activeProject.name}</span>
            </p>
            {activeProject.description && (
              <p className="text-sm text-gray-400 mt-2 max-w-2xl mx-auto">
                {activeProject.description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {experts.map((expert) => {
            const relatedSubs = subExperts.filter(
              (s) => s.expert_id === expert.key
            );

            return (
              <div
                key={expert.id}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-lg"
              >
                <h2 className="text-xl font-bold text-blue-400 mb-2">
                  {expert.name}
                </h2>
                <p className="text-gray-300 text-sm mb-4">
                  {expert.description}
                </p>

                {relatedSubs.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Sin subexpertos asociados.
                  </p>
                ) : (
                  relatedSubs.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex justify-between items-center bg-gray-900 p-3 rounded-lg hover:bg-gray-700 transition cursor-pointer"
                    >
                      <div>
                        <p className="font-medium">{sub.title}</p>
                        <p className="text-xs text-gray-400">
                          {sub.description}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            router.push(`/chat/${sub.id}?project=${activeProject?.id}`)
                          }
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-md"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => handleExecute(sub.id)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
                        >
                          Ejecutar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
