"use client";

import React, { useEffect, useRef, useState } from "react";

type Mensaje = { role: "user" | "assistant"; content: string };

export default function Chat({ experto }: { experto: string }) {
  const [messages, setMessages] = useState<Mensaje[]>([
    { role: "assistant", content: `👋 Hola, soy tu experto en ${experto}. ¿En qué puedo ayudarte?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg: Mensaje = { role: "user", content: input };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_prompt: `Eres un experto en ${experto}, ayuda al usuario de forma clara y organizada.`,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      const replyText =
        data.reply ?? data.answer ?? data.content ?? "⚠️ No obtuve respuesta del servidor.";
      setMessages((m) => [...m, { role: "assistant", content: String(replyText) }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ Error al conectar con el servidor." }]);
      console.error("Error al llamar /api/chat", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ height: 420, overflowY: "auto", border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "10px 12px",
                borderRadius: 12,
                background: m.role === "user" ? "#0b74ff" : "#f1f3f5",
                color: m.role === "user" ? "#fff" : "#111",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder={`Escribe a ${experto}...`}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 6 }}
        >
          {loading ? "..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
