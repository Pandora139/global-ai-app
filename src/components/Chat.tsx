"use client";
import { useState } from "react";

export default function Chat({ nombre, tipo }: { nombre: string; tipo: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages, tipo }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
  };

  return (
    <div className="border rounded p-4 w-full max-w-lg">
      <h2 className="text-lg font-bold mb-2">
        Chat de {nombre} con el experto en {tipo}
      </h2>

      <div className="h-64 overflow-y-auto border-b mb-2 p-2">
        {messages.map((msg, i) => (
          <p key={i} className={msg.role === "user" ? "text-blue-600" : "text-green-600"}>
            <strong>{msg.role}:</strong> {msg.content}
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
