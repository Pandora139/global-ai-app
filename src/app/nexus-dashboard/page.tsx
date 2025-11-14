"use client";

import { useState } from "react";
import NexusSidebar from "@/components/NexusSidebar";
import NexusContentPanel from "@/components/NexusContentPanel";
import "@/styles/nexus.css";

export default function NexusDashboard() {
  const [selectedSubExpert, setSelectedSubExpert] = useState<any>(null);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-300 flex">
      {/* === Sidebar Izquierda === */}
      <aside className="w-72 bg-[#111317] border-r border-gray-800 shadow-xl flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-xl font-semibold text-white tracking-wide">⚙️ NEXUS</h1>
          <p className="text-xs text-gray-500 mt-1">Inteligencia Creativa</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NexusSidebar
            onSelectExpert={setSelectedExpert}
            onSelectSubExpert={setSelectedSubExpert}
          />
        </div>

        <div className="p-4 border-t border-gray-800 text-center text-sm text-gray-500">
          © 2025 NEXUS
        </div>
      </aside>

      {/* === Panel de Contenido === */}
      <main className="flex-1 p-8 overflow-y-auto bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto bg-[#111317] border border-gray-800 rounded-xl shadow-lg p-6">
          <NexusContentPanel
            expert={selectedExpert}
            subExpert={selectedSubExpert}
          />
        </div>
      </main>
    </div>
  );
}
