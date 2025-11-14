"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) router.push("/auth");
      else setSession(data.session);
      setLoading(false);
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.push("/auth");
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-lg">Cargando sesión...</div>
      </div>
    );

  return <>{children}</>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email || null);
    });

    const stored = localStorage.getItem("activeProject");
    if (stored) {
      setActiveProject(JSON.parse(stored));
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("activeProject");
    router.push("/auth");
  };

  const handleChangeProject = () => {
    localStorage.removeItem("activeProject");
    setActiveProject(null);
    router.push("/projects");
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* 🔹 Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
              IA
            </div>
            <div>
              <div className="font-bold text-lg text-white">Mi Plataforma</div>
              <div className="text-xs text-gray-400">Orientación y expertos</div>
            </div>
          </div>

          <nav className="flex items-center gap-4 text-sm text-gray-300">
            <a href="/projects" className="hover:text-blue-400">
              Proyectos
            </a>
            <a href="/" className="hover:text-blue-400">
              Expertos
            </a>
            <a href="/auth" className="hover:text-blue-400">
              Asistente
            </a>

            {userEmail ? (
              <div className="flex items-center gap-3 ml-4">
                <span className="text-gray-400 text-xs">{userEmail}</span>

                {activeProject && (
                  <div className="flex items-center gap-2 ml-3 bg-gray-700 px-3 py-1 rounded-lg text-sm">
                    <span className="text-gray-300">Proyecto:</span>
                    <span className="font-semibold text-white">
                      {activeProject.name}
                    </span>
                    <button
                      onClick={handleChangeProject}
                      className="ml-2 text-xs text-blue-400 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg"
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
              >
                Iniciar sesión
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* 🔸 Contenido protegido */}
      <main className="flex-1">
        <AuthGuard>{children}</AuthGuard>
      </main>

      {/* 🔹 Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 text-gray-400 text-center text-sm py-4">
        © {new Date().getFullYear()} Mi Plataforma · Hecho para Colombia 🇨🇴
      </footer>
    </div>
  );
}
