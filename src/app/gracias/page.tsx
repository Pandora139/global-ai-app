import Link from 'next/link';

export default function GraciasPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-600 mb-4 tracking-tight">
        ¡Gracias por completar el cuestionario!
      </h1>
      <p className="text-xl text-gray-700 mb-8 max-w-lg">
        Tus respuestas han sido guardadas con éxito. Agradecemos tu tiempo.
      </p>
      <Link href="/cuestionario" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300">
        Volver a empezar
      </Link>
    </div>
  );
}