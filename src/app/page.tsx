import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
        Bienvenido a tu plataforma de IA
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl text-center">
        Tu asistente personal de IA. Escoge una funcionalidad en el menú de la izquierda para empezar.
      </p>
      <div className="flex space-x-4">
        <Link href="/cuestionario" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300">
          Empezar
        </Link>
      </div>
    </>
  );
}