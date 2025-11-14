"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ChatClient from "@/components/ChatClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SubExpert {
  id: string;
  title: string;
  description: string;
}

export default function SubExpertPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const subExpertId = params?.subExpertId as string;
  const projectId = searchParams.get("project");
  const autoRun = searchParams.get("autoRun") === "true";

  const [subExpert, setSubExpert] = useState<SubExpert | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [executing, setExecuting] = useState(false);

  // 🟢 Cargar subexperto y mensajes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: subData }, { data: msgData }] = await Promise.all([
          supabase.from("sub_experts").select("id, title, description").eq("id", subExpertId).single(),
          projectId
            ? supabase
                .from("messages")
                .select("id, role, content")
                .eq("sub_expert_id", subExpertId)
                .eq("project_id", projectId)
                .order("created_at", { ascending: true })
            : { data: [] },
        ]);

        if (subData) setSubExpert(subData);
        if (msgData) setMessages(msgData as Message[]);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    };

    if (subExpertId) fetchData();
  }, [subExpertId, projectId]);

  // ⚡ Ejecutar desarrollo automático (solo si viene de autoRun)
  useEffect(() => {
    const autoExecute = async () => {
      if (!autoRun || !projectId) return;

      setExecuting(true);
      try {
        const res = await fetch("/api/chat/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId, sub_expert_id: subExpertId }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Agregar respuesta al historial visible
        setMessages((prev) => [
          ...prev,
          { id: "auto_user", role: "user", content: "[AUTO-RUN] Ejecución automática del subexperto." },
          { id: "auto_assistant", role: "assistant", content: data.reply },
        ]);
      } catch (err) {
        console.error("❌ Error en ejecución automática:", err);
      } finally {
        setExecuting(false);
      }
    };

    autoExecute();
  }, [autoRun, projectId, subExpertId]);

  if (loading) return <p className="text-center text-gray-400 mt-10">Cargando subexperto...</p>;
  if (!subExpert)
    return <p className="text-center text-red-400 mt-10">Subexperto no encontrado.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-blue-400 mb-3">{subExpert.title}</h1>
        <p className="text-gray-300 mb-6">{subExpert.description}</p>

        {projectId ? (
          <p className="text-sm text-gray-400 mb-6">
            🗂 Proyecto activo: <span className="text-blue-400">{projectId}</span>
          </p>
        ) : (
          <p className="text-sm text-red-400 mb-6">
            ⚠️ No hay proyecto seleccionado. Regresa y elige uno.
          </p>
        )}

        {executing && (
          <p className="text-sm text-yellow-400 mb-4">
            ⚙️ Ejecutando desarrollo automático, por favor espera unos segundos...
          </p>
        )}

        {/* Chat con historial */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
          <ChatClient initialMessages={messages} subExpertId={subExpertId} projectId={projectId!} />
        </div>
      </div>
    </div>
  );
}
