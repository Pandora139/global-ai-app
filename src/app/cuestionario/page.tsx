'use client';

import { useState, useEffect } from 'react';
import { supabaseServer } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CuestionarioPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expertType, setExpertType] = useState('');
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);

      const { data: questions, error } = await supabaseServer
        .from('questions')
        .select('*')
        .not('options', 'is', null);

      if (error) {
        setError(error.message);
        console.error('Error al cargar la pregunta:', error);
      } else {
        setQuestions(data);
      }
      setLoading(false);
    };
    fetchQuestions();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(e.target.value);
  };

  const handleExpertSelection = (option: string) => {
    setExpertType(option);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Insertar el usuario y el tipo de experto en la base de datos
      const { data, error } = await supabase
        .from('users')
        .insert([{ name: userName, expert_type: expertType }])
        .select();
    
      if (error) {
        throw error;
      }

      console.log('Datos del usuario insertados:', data);

      // Redirigir a la página del chat
      router.push(`/chat-ia?expert=${expertType}&user=${userName}`);
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return userName.trim() !== '' && expertType !== '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-700">Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Selecciona tu Experto
      </h1>
      <div className="w-full max-w-xl bg-white p-8 rounded-2xl shadow-xl transition-transform transform hover:scale-[1.01]">
        <div className="mb-6 p-4 border rounded-xl bg-gray-50">
          <p className="text-lg text-gray-700 font-semibold mb-2">Tu nombre completo:</p>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="Escribe tu nombre aquí..."
            value={userName}
            onChange={handleNameChange}
          />
        </div>

        {questions.length > 0 && (
          <div className="mb-6 p-4 border rounded-xl bg-gray-50">
            <p className="text-lg text-gray-700 font-semibold mb-2">
              {questions[0].text}
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {Array.isArray(questions[0].options) && questions[0].options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleExpertSelection(option)}
                  className={`px-4 py-2 rounded-lg transition-colors font-medium
                    ${expertType === option
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400 disabled:shadow-none"
          >
            {isSubmitting ? 'Cargando...' : 'Ir a mi Experto'}
          </button>
        </div>
      </div>
    </>
  );
}