import { supabase } from '@/lib/supabaseClient';
import { generateRecommendation } from '@/lib/openaiClient';

// Tipos de datos
type Response = {
  question_id: string;
  answer_text: string;
  nombre_usuario: string;
};

type Question = {
  id: string;
  text: string;
};

export default async function ResultadosPage() {
  const { data: responses, error: responsesError } = await supabase
    .from('responses')
    .select('question_id, answer_text, nombre_usuario') as { data: Response[]; error: any };

  const { data: allQuestions, error: questionsError } = await supabase
    .from('questions')
    .select('*') as { data: Question[]; error: any };

  if (responsesError || questionsError) {
    console.error('Error al cargar los resultados:', responsesError || questionsError);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-red-600 mb-4 tracking-tight">
          Error al cargar los resultados
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-lg">
          Hubo un problema al conectar con la base de datos.
        </p>
      </div>
    );
  }

  // Agrupa las respuestas por usuario
  const groupedResponses: Record<string, Response[]> = responses.reduce(
    (acc: Record<string, Response[]>, current: Response) => {
      (acc[current.nombre_usuario] = acc[current.nombre_usuario] || []).push(current);
      return acc;
    },
    {}
  );

  // Formato para el API de OpenAI
  const userResponsesForAI = responses.map(res => ({
    question: allQuestions.find(q => q.id === res.question_id)?.text || '',
    answer: res.answer_text,
  }));

  const recommendation = await generateRecommendation(userResponsesForAI);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-12 text-center tracking-tight">
        Resultados del Cuestionario
      </h1>
      <div className="max-w-4xl mx-auto">
       {Object.entries(groupedResponses).map(([userName, userResponses]) => {
  const responsesList = userResponses as Response[];
  return (
    <div key={userName} className="bg-white p-8 rounded-2xl shadow-xl mb-8">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6 border-b pb-2">
        Resultados de: {userName}
      </h2>
      <div className="space-y-6">
        {allQuestions.map(q => {
          const answer = responsesList.find(res => res.question_id === q.id);
          return (
            <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-lg text-gray-700">{q.text}</p>
              <p className="mt-2 text-gray-800">
                Respuesta: {answer ? answer.answer_text : 'No respondida'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-green-50 rounded-2xl shadow-inner">
        <h3 className="text-2xl font-bold text-green-700 mb-4">
          Recomendación de carrera
        </h3>
        <p className="text-gray-800 whitespace-pre-wrap">{recommendation}</p>
      </div>
    </div>
  );
})}
