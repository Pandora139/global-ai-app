"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function SubExpertPage({ params }: any) {
  const { subExpertId, expertId } = params;
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [projectDesc, setProjectDesc] = useState("");

  // 🔹 Cargar historial y datos del proyecto
  useEffect(() => {
    if (!projectId || !subExpertId) return;

    const fetchData = async () => {
      try {
        const [messagesRes, projectRes] = await Promise.all([
          fetch(`/api/chat/messages?project_id=${projectId}&sub_expert_id=${subExpertId}`),
          supabase.from("projects").select("description").eq("id", projectId).single(),
        ]);

        const data = await messagesRes.json();
        if (!data.error) setMessages(data);
        if (projectRes.data?.description) setProjectDesc(projectRes.data.description);
      } catch (err) {
        console.error("❌ Error al obtener datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, subExpertId]);

  // 🔹 Enviar mensaje manual
  const handleSend = async () => {
    if (!input.trim() || !projectId || !subExpertId) return;
    await processChat(input, "user");
  };

  // 🔹 Ejecutar desarrollo del subexperto automáticamente
  const handleExecute = async () => {
    setExecuting(true);
    try {
      const { data: sub } = await supabase
        .from("sub_experts")
        .select("title, prompt")
        .eq("id", subExpertId)
        .single();

      const { data: project } = await supabase
        .from("projects")
        .select("description")
        .eq("id", projectId)
        .single();

      const prompt = `
      Subexperto: ${sub?.title}
      Proyecto: ${project?.description || "Sin descripción"}
      Instrucción: ${sub?.prompt || "Desarrolla tu área de especialización según el proyecto descrito."}
      `;

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subExpertId, message: prompt }),
      });

      const result = await response.json();
      const reply =
        result.reply || "⚠️ No se obtuvo respuesta del modelo en este momento.";

      await saveMessage("assistant", reply);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply, created_at: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error("❌ Error en ejecución automática:", err);
    } finally {
      setExecuting(false);
    }
  };

  // 🔹 Guardar mensaje genérico
  const saveMessage = async (role: "user" | "assistant", content: string) => {
    await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        sub_expert_id: subExpertId,
        messages: [{ role, content }],
      }),
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-2xl font-bold text-blue-400 mb-6 text-center">
          💬 Subexperto: {subExpertId}
        </h1>

        {projectDesc && (
          <p className="text-sm text-gray-400 mb-4 text-center">
            🎯 Proyecto: {projectDesc}
          </p>
        )}

        {/* Historial */}
        <div className="bg-gray-800 p-5 rounded-xl mb-4 max-h-[60vh] overflow-y-auto border border-gray-700">
          {loading ? (
            <p className="text-gray-400 text-center">Cargando conversación...</p>
          ) : messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={`mb-3 ${
                  m.role === "user" ? "text-blue-300 text-right" : "text-gray-300 text-left"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">No hay mensajes aún.</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <button
            onClick={handleExecute}
            disabled={executing}
            className={`px-5 py-3 rounded-lg text-white font-semibold transition-all ${
              executing ? "bg-gray-600" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {executing ? "Procesando..." : "🚀 Ejecutar desarrollo del subexperto"}
          </button>

          <div className="flex gap-2 flex-1">
            <input
              type="text"
              className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Mensaje de prueba..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              onClick={handleSend}
              disabled={isSending}
              className={`px-5 py-2 rounded-lg ${
                isSending ? "bg-gray-600" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
