"use client";

import { useState } from "react";
import Questions from "./Questions";

export default function OptionMenu() {
  const [tipo, setTipo] = useState("Tecnología");

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Selecciona tu experto</h1>

      {/* Dropdown para elegir el experto */}
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="border p-2 rounded mb-4 w-full"
      >
        <option>Tecnología</option>
        <option>Finanzas</option>
        <option>Salud</option>
      </select>

      {/* Chat con el experto */}
      <Questions tipo={tipo} />
    </div>
  );
}
