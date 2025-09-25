"use client";

import { useState } from "react";

export default function Questions({ tipo }: { tipo: string }) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo, // viene como prop desde OptionMenu
          messages: newMessages,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">
        Conversación con el experto en {tipo}
      </h2>

      <div className="border rounded p-2 h-80 overflow-y-auto mb-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 ${
              msg.role === "user" ? "text-blue-600" : "text-green-700"
            }`}
          >
            <strong>{msg.role === "user" ? "Tú" : "Experto"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
        {loading && <p className="italic text-gray-500">Escribiendo...</p>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded p-2"
          placeholder="Escribe tu pregunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
