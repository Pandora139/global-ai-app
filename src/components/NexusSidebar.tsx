"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChevronDown, ChevronRight, PlusCircle } from "lucide-react";
import Link from "next/link";


type ExpertRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
};

type SubExpertRow = {
  id: string;
  expert_id: string; // en tu base esto es el "key" del experto, no el uuid
  title: string;
  description: string | null;
};

export default function NexusSidebar({
  onSelectExpert,
  onSelectSubExpert,
}: {
  onSelectExpert: (exp: any) => void;
  onSelectSubExpert: (sub: any) => void;
}) {
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [subExperts, setSubExperts] = useState<SubExpertRow[]>([]);
  const [openExpertKey, setOpenExpertKey] = useState<string | null>(null);

  // 1. Traer expertos y sub_experts directo desde Supabase
  useEffect(() => {
    const load = async () => {
      try {
        const { data: expData, error: expErr } = await supabase
          .from("experts")
          .select("id, key, name, description")
          .eq("is_active", true);

        if (expErr) {
          console.error("❌ Error cargando experts:", expErr);
        } else {
          setExperts(expData || []);
        }

        const { data: subData, error: subErr } = await supabase
          .from("sub_experts")
          .select("id, expert_id, title, description, is_active, is_visible")
          .eq("is_active", true)
          .eq("is_visible", true);

        if (subErr) {
          console.error("❌ Error cargando sub_experts:", subErr);
        } else {
          // nos quedamos solo con activos
          setSubExperts(
            (subData || []).map((s: any) => ({
              id: s.id,
              expert_id: s.expert_id, // esto en tu db coincide con experts.key
              title: s.title,
              description: s.description ?? null,
            }))
          );
        }
      } catch (e) {
        console.error("❌ Error general cargando sidebar:", e);
      }
    };

    load();
  }, []);

  // 🧭 Nueva función para abrir páginas del dashboard (Historial, Productos, etc.)
  const handleNavigate = (path: string) => {
    if (typeof window !== "undefined") {
      window.location.href = path; // navegación directa
    }
  };

  return (
    <aside className="bg-[#0b0c10] text-gray-300 h-full w-64 flex flex-col border-r border-gray-800 select-none">
      {/* HEADER / LOGO */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-xl">⚡</span>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-lg text-white tracking-wide">
              NEXUS
            </span>
            <span className="text-[11px] text-gray-500">
              Inteligencia Creativa
            </span>
          </div>
        </div>
      </div>

      {/* DASHBOARD SECTION */}
      <div className="px-4 py-4 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
        Dashboard
        <ul className="mt-3 space-y-2 normal-case text-sm text-gray-300">
          <li
            className="flex items-center gap-2 hover:text-green-400 cursor-pointer"
            onClick={() => {
              onSelectExpert(null);
              setOpenExpertKey(null);
            }}
          >
            <span>🏠</span> <span>Inicio</span>
          </li>

         <li>
  <Link
    href="/nexus-dashboard/productos"
    className="flex items-center gap-2 hover:text-green-400 cursor-pointer"
  >
    <span>📦</span>
    <span>Productos</span>
  </Link>
</li>


          

          <li className="flex items-center gap-2 hover:text-green-400 cursor-pointer">
            <span>📝</span> <span>Tareas</span>
          </li>

          {/* ✅ NUEVO: enlace funcional al historial */}
          <li
            className="flex items-center gap-2 hover:text-green-400 cursor-pointer"
            onClick={() => handleNavigate("/nexus-dashboard/historial")}
          >
            <span>📊</span> <span>Historial</span>
          </li>
        </ul>
      </div>

      {/* HERRAMIENTAS SECTION */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-800 text-xs uppercase tracking-wide text-gray-400">
          Herramientas
        </div>

        <div className="px-2 py-2">
          {experts.map((expert) => {
            // ojo: acá asociamos usando expert.key
            const subsForThis = subExperts.filter(
              (s) => s.expert_id === expert.key
            );

            const isOpen = openExpertKey === expert.key;

            return (
              <div
                key={expert.id}
                className="mb-2 border-b border-gray-800 pb-2"
              >
                {/* fila del experto */}
                <button
                  className="w-full flex items-center justify-between text-left text-sm text-gray-200 hover:text-blue-400 transition-colors px-2 py-2 rounded-md cursor-pointer"
                  onClick={() => {
                    // toggle acordeón visual
                    setOpenExpertKey(isOpen ? null : expert.key);
                    // además notificamos al panel derecho que se seleccionó este experto
                    onSelectExpert(expert);
                  }}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {isOpen ? (
                      <ChevronDown
                        size={16}
                        className="text-blue-400 shrink-0"
                      />
                    ) : (
                      <ChevronRight
                        size={16}
                        className="text-gray-500 shrink-0"
                      />
                    )}
                    <span>{expert.name}</span>
                  </span>
                </button>

                {/* submenús */}
                {isOpen && subsForThis.length > 0 && (
                  <ul className="mt-1 ml-6 space-y-1 text-[13px] text-gray-400">
                    {subsForThis.map((sub) => (
                      <li
                        key={sub.id}
                        className="hover:text-green-400 cursor-pointer flex items-start"
                        onClick={() => {
                          onSelectSubExpert(sub);
                        }}
                      >
                        <span className="leading-snug">{sub.title}</span>
                      </li>
                    ))}

                    <li
                      className="text-[12px] flex items-center gap-1 text-gray-600 hover:text-blue-400 cursor-pointer mt-2"
                      onClick={() =>
                        alert("✨ Próximamente podrás agregar tu propio módulo.")
                      }
                    >
                      <PlusCircle size={12} />
                      <span>Nuevo</span>
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-4 py-4 border-t border-gray-800 text-[11px] text-gray-600">
        <div>NEXUS © {new Date().getFullYear()}</div>
        <div>v1.0 · Sistema Inteligente</div>
      </div>
    </aside>
  );
}
