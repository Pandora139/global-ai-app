"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, Download, Archive } from "lucide-react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun } from "docx";
import React from "react";


export default function HistorialPage() {
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [filterProject, setFilterProject] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
 

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data?.user || null);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentUser?.id) return;
      setLoading(true);

      const { data } = await supabase
        .from("user_history")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("is_archived", false)
        .order("date", { ascending: false });

      setHistory(data || []);
      setLoading(false);
    };
    loadHistory();
  }, [currentUser]);

  const filtered = history.filter((h) => {
    const byProject =
      filterProject === "__all__" || h.project_name === filterProject;
    const q = search.trim().toLowerCase();
    return (
      byProject &&
      (
        h.project_name?.toLowerCase().includes(q) ||
        h.sub_expert_title?.toLowerCase().includes(q) ||
        h.content?.toLowerCase().includes(q)
      )
    );
  });

  const projects = Array.from(new Set(history.map((h) => h.project_name)));

  // ✅ Descargar DOCX
  const handleDownloadWord = async (h: any) => {
  const lines = h.content.split("\n");

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: h.project_name || "Resultado",
                bold: true,
                size: 36,
              }),
            ],
          }),
          ...lines.map(
            (line) =>
              new Paragraph({
                spacing: { before: 120, after: 120 },
                children: [
                  new TextRun({
                    text: line,
                    size: 24,
                  }),
                ],
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${h.project_name || "resultado"}.docx`);
};

  const handleArchive = async (id: string) => {
    await supabase.from("user_history").update({ is_archived: true }).eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <main className="p-8 text-gray-200 bg-[#0b0c10] min-h-screen">
      <h1 className="text-2xl font-bold text-blue-400 mb-6">🕓 Historial</h1>
 <button
  onClick={() => router.push("/nexus-dashboard")}
  className="fixed bottom-6 left-6 flex items-center gap-2 bg-gray-900/90 hover:bg-gray-800 text-gray-200 px-4 py-2 rounded-full border border-gray-700 shadow-lg backdrop-blur-md transition-all hover:scale-105"
>
  ← Volver al Dashboard
</button>



      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
        >
          <option value="__all__">Todos los productos</option>
          {projects.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 italic">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-gray-800">
            <thead>
              <tr className="bg-gray-800 text-gray-300">
                <th className="p-3 border border-gray-800">Producto</th>
                <th className="p-3 border border-gray-800">Tipo</th>
                <th className="p-3 border border-gray-800">Fecha</th>
                <th className="p-3 border border-gray-800 text-center">Acción</th>
              </tr>
            </thead>

            
<tbody>
  {filtered.map((h) => (
    <React.Fragment key={h.id}>

      {/* Fila principal */}
      <tr className="hover:bg-gray-800 border-b border-gray-700 transition">
        <td className="p-3">{h.project_name || "Sin nombre"}</td>
        <td className="p-3 text-gray-400">{h.sub_expert_title}</td>
        <td className="p-3 text-gray-500">{new Date(h.date).toLocaleString()}</td>
        <td className="p-3 flex justify-center gap-3">
          
          {/* Toggle Expand */}
          <button
            className="text-blue-400 hover:text-blue-300"
            onClick={() =>
              setExpandedId((prev) => (prev === h.id ? null : h.id))
            }
          >
            <Eye size={16} />
          </button>

          {/* Descargar como Word */}
          <button
            className="text-green-400 hover:text-green-300"
            onClick={() => handleDownloadWord(h)}
          >
            <Download size={16} />
          </button>

          {/* Archivar */}
          <button
            className="text-red-400 hover:text-red-300"
            onClick={() => handleArchive(h.id)}
          >
            <Archive size={16} />
          </button>
        </td>
      </tr>

      {/* Expandible */}
      {expandedId === h.id && (
        <tr className="bg-[#111317] border-b border-gray-800">
          <td colSpan={4} className="p-5">

            <div className="rounded-lg border border-gray-700 bg-gray-900/60 backdrop-blur p-5 max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-gray-200 leading-relaxed shadow-inner">
              {h.content}
            </div>

            <div className="flex justify-end gap-3 mt-3">
              <button
                onClick={() => navigator.clipboard.writeText(h.content)}
                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded shadow"
              >
                📋 Copiar
              </button>

              <button
                onClick={() => setExpandedId(null)}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded shadow"
              >
                ✖ Cerrar
              </button>
            </div>

          </td>
        </tr>
      )}

    </React.Fragment>
  ))}
</tbody>


          </table>
        </div>
      )}
    </main>
  );
}
