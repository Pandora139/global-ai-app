'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OptionMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300"
      >
        Opciones
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Selecciona una acción:</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/cuestionario" className="block w-full text-left px-4 py-2 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
                Regresar al Cuestionario
              </Link>
            </li>
            {/* Aquí puedes agregar más opciones en el futuro, como 'Generar Imagen' o 'Analizar Documento' */}
          </ul>
        </div>
      )}
    </div>
  );
}