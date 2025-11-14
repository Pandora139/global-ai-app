"use client";

import { useState, useRef, useEffect } from "react";
import ExpertsSelector, { Expert } from "@/components/ExpertsSelector";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!selectedExpert) {
      alert("⚠️ Selecciona un experto primero");
      return;
    }
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_prompt: selectedExpert.system_prompt,
        messages: updatedMessages,
      }),
    });

    const data = await res.json();
    setMessages([
      ...updatedMessages,
      { role: "assistant", content: data.reply },
    ]);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Selector de expertos */}
      <ExpertsSelector onSelect={setSelectedExpert} />

      {/* Chat */}
      <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex mb-3 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && selectedExpert && (
              <img
                src={selectedExpert.avatar_url}
                alt={selectedExpert.name}
                className="w-8 h-8 rounded-full mr-2 self-end border"
              />
            )}
            <div
              className={`p-3 rounded-2xl max-w-[70%] shadow text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-800 border"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 p-4 border-t bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border p-2 rounded focus:outline-none focus:ring focus:ring-blue-300"
          placeholder={
            selectedExpert
              ? `Habla con ${selectedExpert.name}...`
              : "Selecciona un experto para empezar"
          }
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
