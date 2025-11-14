"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();

    // limpiar localStorage (proyectos, historial, etc.)
    localStorage.removeItem("activeProject");
    localStorage.removeItem("userProjects");
    localStorage.removeItem("nexusHistory");

    // redirigir a login
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-200">
      
      {/* 🔹 Barra superior */}
      <header className="w-full bg-[#111317] border-b border-gray-800 px-6 py-3 flex justify-end">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </header>

      {/* 🔹 Contenido del dashboard */}
      <div>{children}</div>
    </div>
  );
}
