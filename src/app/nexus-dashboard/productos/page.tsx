"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/**
 * Mide el progreso por producto:
 * progreso = (#sub_expertos_distintos_usados del proyecto) / (total de sub_experts activos)
 * Ambos contadores vienen de Supabase.
 */

type Project = {
  id: string;
  title?: string;
  name?: string;
  description?: string | null;
  type?: string | null;
};

type HistoryRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  project_name: string | null;
  sub_expert_title: string | null;
  date: string | null;
};

export default function ProductsListPage() {
  const router = useRouter();

  
  const [userId, setUserId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [totalSubexperts, setTotalSubexperts] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  
  // 1) usuario
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    })();
  }, []);

  // 2) carga de proyectos (usamos tu API ya existente)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        // misma API que usas en ProductsPanel
        const res = await fetch(`/api/chat/projects?user_id=${userId}`);
        const data = await res.json();
        if (!data?.error) setProjects(data);
      } catch (e) {
        console.error("Error cargando proyectos:", e);
      }
    })();
  }, [userId]);

  // 3) historial del usuario
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_history")
        .select("id,user_id,project_id,project_name,sub_expert_title,date")
        .eq("user_id", userId)
        .eq("is_archived", false);
      if (!error && data) setHistory(data as HistoryRow[]);
    })();
  }, [userId]);

  // 4) total de sub-expertos activos (desde Supabase)
  useEffect(() => {
    (async () => {
      // Ajusta filtros si tienes columnas como area/experto_id
      const { count, error } = await supabase
        .from("sub_experts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (!error && typeof count === "number") setTotalSubexperts(count);
      setLoading(false);
    })();
  }, []);

  // 5) progreso por proyecto (distinct sub_expert_title usados)
  const progressByProject: Record<string, number> = useMemo(() => {
    if (!totalSubexperts || totalSubexperts <= 0) return {};
    const map: Record<string, Set<string>> = {};

    for (const h of history) {
      if (!h.project_id || !h.sub_expert_title) continue;
      if (!map[h.project_id]) map[h.project_id] = new Set();
      map[h.project_id].add(h.sub_expert_title);
    }

    const out: Record<string, number> = {};
    for (const p of projects) {
      const pid = p.id;
      const used = map[pid]?.size ?? 0;
      const ratio = Math.min(used / totalSubexperts, 1);
      out[pid] = Math.round(ratio * 100);
    }
    return out;
  }, [projects, history, totalSubexperts]);

  return (
    
    <main className="p-8 text-gray-200 bg-[#0b0c10] min-h-screen">
      <h1 className="text-2xl font-bold text-blue-400 flex items-center gap-2 mb-6">
        <span>📦 Mis Productos</span>
      </h1>

      {loading ? (
        <div className="text-gray-400">Cargando…</div>
      ) : projects.length === 0 ? (
        <div className="text-gray-400">Aún no tienes productos.</div>
      ) : (
        <div className="space-y-5">
          {projects.map((p) => {
            const title = p.title || p.name || "Sin nombre";
            const percent = progressByProject[p.id] ?? 0;
            return (
              <div
                key={p.id}
                onClick={() => router.push(`/nexus-dashboard/productos/${p.id}`)}
                className="cursor-pointer rounded-xl border border-gray-800 bg-[#12151b] hover:bg-[#161a22] transition p-4"
              >
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-blue-300">{title}</div>
                  <div className="text-sm text-gray-400">{percent}%</div>
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Progreso del desarrollo
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Botón para regresar al dashboard */}
<div className="mt-10 flex justify-start">
  <button
    onClick={() => router.push("/nexus-dashboard")}
    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition"
  >
    ← Volver al Dashboard
  </button>
</div>

    </main>
  );
}
