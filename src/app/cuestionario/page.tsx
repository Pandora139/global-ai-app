import { supabaseServer } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import { generateQuestions } from '@/lib/openaiClient';
import Question from '@/components/Question';

export default async function CuestionarioPage() {
  const { data: questions, error } = await supabaseServer
    .from('questions')
    .select('*')
    .not('options', 'is', null);

  if (error) {
    console.error('Error fetching questions:', error);
    return notFound();
  }

  const { data: responses, error: responsesError } = await supabaseServer
    .from('responses')
    .select('question_id, user_name');

  if (responsesError) {
    console.error('Error fetching responses:', responsesError);
    return notFound();
  }

  const answeredQuestions = new Set(responses.map(res => res.question_id));
  const unansweredQuestions = questions.filter(q => !answeredQuestions.has(q.id));

  let finalQuestions = unansweredQuestions;

  // Lógica para generar preguntas adicionales si es necesario
  if (unansweredQuestions.length < 5) {
    try {
      const questionsFromAI = await generateQuestions(
        questions.map(q => q.text)
      );
      // Asume que las preguntas de la IA tienen un formato compatible
      finalQuestions = [...unansweredQuestions, ...questionsFromAI];
    } catch (aiError) {
      console.error('Error generating AI questions:', aiError);
      // Si la IA falla, continúa con las preguntas disponibles
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 text-center tracking-tight">
        Responde las preguntas
      </h1>
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl">
        <form>
          {finalQuestions.map(q => (
            <Question key={q.id} question={q} />
          ))}
          <div className="mt-8 text-center">
            <button
              type="submit"
              className="w-full py-3 px-6 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105"
            >
              Ver mis resultados
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}