"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";

type Role = "user" | "assistant";

interface ChatClientProps {
  projectId?: string | null;
  subExpertId: string;
}

export default function ChatClient({ projectId, subExpertId }: ChatClientProps) {
  const [messages, setMessages] = useState<Array<{ role: Role; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subExpertName, setSubExpertName] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);



  // Obtener nombre del subexperto real
useEffect(() => {
  const loadSubExpert = async () => {
    const res = await fetch(`/api/chat/subexpert?id=${subExpertId}`);
    const data = await res.json();
    if (data?.title) setSubExpertName(data.title);
  };
  loadSubExpert();
}, [subExpertId]);

  // 🔹 Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🟢 Cargar historial SOLO si hay projectId
  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) return;
      try {
        const res = await fetch(
          `/api/chat/messages?project_id=${projectId}&sub_expert_id=${subExpertId}`
        );
        const data = await res.json();
        if (!data?.error && Array.isArray(data)) {
          setMessages(
            data.map((m: any) => ({
              role: (m.role as Role) ?? "assistant",
              content: m.content as string,
            }))
          );
        }
      } catch (err) {
        console.error("❌ Error al cargar historial:", err);
      }
    };
    loadHistory();
  }, [projectId, subExpertId]);

  // 🟣 Enviar mensaje (NO exige projectId)
  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg = { role: "user" as Role, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // 1) Guardar mensaje del usuario si hay projectId
      if (projectId) {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            sub_expert_id: subExpertId,
            messages: [{ role: "user", content: text }],
          }),
        });
      }

      // 2) Obtener respuesta del backend IA
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subExpertId, message: text }),
      });

      // Manejar HTML de error (evita “Unexpected token '<'…”)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("❌ /api/chat/send no devolvió JSON. Status:", res.status);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Hubo un problema con el servicio. Intenta de nuevo en unos segundos.",
          },
        ]);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      if (data?.error) {
        throw new Error(data.error);
      }

      const reply =
        data?.reply || "No tengo una respuesta en este momento.";
      const aiMsg = { role: "assistant" as Role, content: reply };

      // 3) Guardar respuesta si hay projectId
      if (projectId) {
        await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            sub_expert_id: subExpertId,
            messages: [{ role: "assistant", content: reply }],
          }),
        });
      }

      // 4) Pintar respuesta
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("❌ Error al enviar mensaje:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ No pude conectar con el servidor en este momento. Intenta de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Sidebar */}
      <aside className="w-80 bg-gradient-to-b from-blue-700 to-indigo-800 text-white flex flex-col items-center p-6 shadow-lg">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mb-3 shadow-md">
            💬
          </div>
          <h2 className="text-lg font-semibold">Subexperto activo</h2>
          <p className="text-sm opacity-80 mt-1 mb-4">
            Proyecto:{" "}
            <span className="font-medium text-blue-200">
              {projectId || "— (no seleccionado)"}
            </span>
          </p>
          <hr className="border-white/30 w-full mb-4" />
          <p className="text-sm opacity-90 leading-relaxed">
            💡 Puedes conversar aunque no tengas proyecto seleccionado.  
            Si eliges uno, el historial quedará guardado.
          </p>
        </motion.div>
        <div className="mt-auto text-xs opacity-70 pt-6 border-t border-white/20 text-center">
          © {new Date().getFullYear()} Mi Plataforma
          <br />
          Hecho con ❤️ en Colombia 🇨🇴
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col justify-between bg-gray-900 rounded-l-3xl shadow-xl overflow-hidden">
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 shadow-md">
          <h1 className="text-2xl font-bold mb-1">Chat con el subexperto</h1>
          <p className="text-sm opacity-80">
            Sub-experto: <span className="font-medium">{subExpertId}</span>
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-800">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[75%] shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 border border-gray-300 rounded-bl-none"
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex border-t border-gray-700 bg-gray-900 p-4">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-700 rounded-l-xl bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Escribe tu mensaje aquí..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-r-xl transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </main>
    </div>
  );
}
