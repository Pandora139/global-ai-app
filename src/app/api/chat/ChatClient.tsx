'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatClient() {
  const searchParams = useSearchParams();
  const expertType = searchParams.get('tipo');
  const userName = searchParams.get('nombre');

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (expertType) {
      setMessages([
        {
          type: 'ai',
          text: `¡Hola ${userName || "invitado"}! 👋 Soy tu experto en **${expertType}**. Cuéntame, ¿en qué puedo ayudarte hoy?`,
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

    const payload = {
      expertType: expertType || 'General',
      userQuestion: input || '',
      history: [...messages, userMessage],
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const aiResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          text: aiResponse.answer || 'No tengo una respuesta en este momento.',
        },
      ]);
    } catch (error) {
      console.error('❌ Error al comunicarse con la API:', error);
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          text: '⚠️ Lo siento, hubo un problema al conectar con el servidor. Intenta de nuevo más tarde.',
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-10 px-4">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            💬 Chat con tu Experto en {expertType}
          </h1>
          <p className="text-sm opacity-90 mt-1">
            Hola {userName || 'invitado'}, ¡estás hablando con un experto listo para ayudarte!
          </p>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto h-[500px] p-6 space-y-4 bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${
                  msg.type === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.type === 'ai' ? (
                  <div className="prose prose-blue max-w-none prose-sm md:prose-base">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.text}</p>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="p-3 bg-gray-200 rounded-2xl text-gray-700 text-sm italic shadow-sm">
                El experto está escribiendo...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex border-t border-gray-200 bg-white p-4">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-r-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>

      <footer className="mt-6 text-gray-500 text-sm">
        © 2025 Mi Plataforma · Hecho para Colombia 🇨🇴
      </footer>
    </div>
  );
}
