'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ChatClient() {
  const searchParams = useSearchParams();
  const expertType = searchParams.get('tipo');
  const userName = searchParams.get('nombre');

  // Logs de depuración al cargar la página
  console.log("🔎 searchParams raw:", searchParams?.toString());
  console.log("🔎 expertType (cliente):", expertType, " | userName:", userName);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (expertType) {
      setMessages([
        {
          type: 'ai',
          text: `¡Hola ${userName}! Soy tu experto en ${expertType}. ¿En qué puedo ayudarte hoy?`,
        },
      ]);
    }
  }, [expertType, userName]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { type: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    // --- Bloque que prepara el payload para el fetch ---
    const payload = {
      expertType: expertType || "General",
      userQuestion: input || "",
      history: [...messages, userMessage], // incluimos también el último mensaje
    };

    console.log("📤 Enviando a /api/chat (cliente):", payload);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const aiResponse = await response.json();
      console.log("📥 Respuesta /api/chat (cliente):", aiResponse);

      setMessages((prev) => [
        ...prev,
        { type: 'ai', text: aiResponse.answer },
      ]);
    } catch (error) {
      console.error('Error al comunicarse con la API de IA:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          text: 'Lo siento, no pude comunicarme con mi cerebro de IA en este momento.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Habla con tu Experto en {expertType}
      </h1>
      <div className="w-full max-w-xl bg-white p-6 rounded-2xl shadow-xl flex flex-col h-[600px]">
        {/* Ventana de chat */}
        <div className="flex-1 overflow-y-auto p-4 border-b border-gray-200">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 p-3 rounded-lg max-w-[80%] ${
                msg.type === 'user'
                  ? 'bg-indigo-100 text-indigo-900 self-end ml-auto'
                  : 'bg-gray-100 text-gray-800 self-start'
              }`}
            >
              <p>{msg.text}</p>
            </div>
          ))}
          {isTyping && (
            <div className="mb-4 p-3 rounded-lg bg-gray-100 text-gray-800 self-start">
              <p>El experto está escribiendo...</p>
            </div>
          )}
        </div>

        {/* Campo de entrada de texto */}
        <div className="flex mt-4">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="Escribe tu pregunta aquí..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) handleSendMessage();
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-r-lg shadow-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </>
  );
}
