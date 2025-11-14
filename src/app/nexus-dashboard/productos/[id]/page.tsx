"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type HistoryRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  project_name: string | null;
  sub_expert_title: string | null;
  content: string | null;
  date: string | null;
};

export default function ProductoDetalle(props: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // ✅ Next 15: params es una promise
  const { id: productId } = use(props.params);

  const [userId, setUserId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [totalSubexperts, setTotalSubexperts] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // panel lateral
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<HistoryRow | null>(null);

  // 1) usuario
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    })();
  }, []);

  // 2) datos
  useEffect(() => {
    if (!userId || !productId) return;
    setLoading(true);

    (async () => {
      // historial del proyecto
      const { data: hist, error: eh } = await supabase
        .from("user_history")
        .select("id,user_id,project_id,project_name,sub_expert_title,content,date")
        .eq("user_id", userId)
        .eq("project_id", productId)
        .eq("is_archived", false)
        .order("date", { ascending: false });

      if (!eh && hist) setHistory(hist as HistoryRow[]);

      // total sub-experts activos
      const { count, error: es } = await supabase
        .from("sub_experts")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (!es && typeof count === "number") setTotalSubexperts(count || 0);

      setLoading(false);
    })();
  }, [userId, productId]);

  // progreso del proyecto (distinct sub_expert_title)
  const progressPct = useMemo(() => {
    if (!totalSubexperts || totalSubexperts <= 0) return 0;
    const used = new Set(
      history
        .map((h) => h.sub_expert_title)
        .filter((t): t is string => Boolean(t))
    ).size;
    return Math.min(Math.round((used / totalSubexperts) * 100), 100);
  }, [history, totalSubexperts]);

  const usedSubexperts = useMemo(() => {
    const s = new Set<string>();
    for (const h of history) if (h.sub_expert_title) s.add(h.sub_expert_title);
    return Array.from(s).sort();
  }, [history]);

  return (
    <main className="relative p-8 text-gray-200 bg-[#0b0c10] min-h-screen">
      <button
        onClick={() => router.push("/nexus-dashboard/productos")}
        className="mb-6 rounded-lg bg-gray-800 hover:bg-gray-700 px-4 py-2 text-sm border border-gray-700"
      >
        ← Volver a Productos
      </button>

      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-blue-400">
        {history[0]?.project_name || "Detalle del producto"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Servicio generado automáticamente</p>

      {/* Progreso */}
      <div className="mb-6">
        <div className="text-sm text-gray-400 mb-2">Progreso del desarrollo</div>
        <div className="h-2 w-full rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-2 rounded-full bg-blue-600 transition-[width] duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500">{progressPct}% completado</div>
      </div>

      {/* Sub-expertos usados */}
      <section className="mb-6">
        <h2 className="text-base font-semibold text-gray-200 mb-3">
          Sub-expertos utilizados
        </h2>

        {usedSubexperts.length === 0 ? (
          <div className="text-gray-500 text-sm">Aún no hay actividad.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usedSubexperts.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full border border-blue-700/40 bg-blue-900/20 px-3 py-1 text-xs text-blue-200"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Historial */}
      <section>
        <h2 className="text-base font-semibold text-gray-200 mb-3">
          Historial del Producto
        </h2>

        {loading ? (
          <div className="text-gray-400">Cargando…</div>
        ) : history.length === 0 ? (
          <div className="text-gray-500 text-sm">Sin registros aún.</div>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-[#12151b]">
            {history.map((h) => (
              <div
                key={h.id}
                className="border-b border-gray-800 last:border-none p-4 hover:bg-[#161a22] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-blue-300">
                    {h.sub_expert_title || "Subexperto"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {h.date ? new Date(h.date).toLocaleString() : ""}
                  </div>
                </div>

                {h.content && (
                  <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-gray-200">
                    {h.content}
                  </pre>
                )}

                {/* botón abre panel lateral */}
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setDrawerItem(h);
                      setDrawerOpen(true);
                    }}
                    className="text-xs rounded-md border border-gray-700 px-2 py-1 hover:bg-gray-800"
                  >
                    Ver en panel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Panel lateral (drawer) */}
      {drawerOpen && drawerItem && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed right-0 top-0 h-full w-[420px] bg-[#0f1319] border-l border-gray-800 z-50 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-300">
                {drawerItem.sub_expert_title}
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-sm rounded-md border border-gray-700 px-2 py-1 hover:bg-gray-800"
              >
                Cerrar
              </button>
            </div>

            <div className="text-xs text-gray-500 mb-2">
              {drawerItem.date ? new Date(drawerItem.date).toLocaleString() : ""}
            </div>

            <pre className="whitespace-pre-wrap text-sm text-gray-200">
              {drawerItem.content}
            </pre>
          </aside>
        </>
      )}
    </main>
  );
}
