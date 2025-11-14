"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();

      if (data?.user) {
        // 🔹 Usuario autenticado → Enviar al dashboard
        router.replace("/nexus-dashboard");
      } else {
        // 🔹 No autenticado → Enviar a login
        router.replace("/auth");
      }
    };

    checkSession();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0c10] text-gray-300">
      <div className="text-center space-y-3 animate-pulse">
        <h2 className="text-xl font-semibold text-blue-400">
          Cargando NEXUS…
        </h2>
        <p className="text-gray-500 text-sm">
          Verificando sesión del usuario
        </p>
      </div>
    </main>
  );
}
