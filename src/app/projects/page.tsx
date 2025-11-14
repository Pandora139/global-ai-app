"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Project {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 🔹 Obtener usuario autenticado al cargar la página
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email);
      } else {
        router.push("/auth");
      }
    };
    getUser();
  }, [router]);

  // 🔹 Cargar proyectos del usuario autenticado
  useEffect(() => {
    if (!userId) return;

    const fetchProjects = async () => {
      try {
        const res = await fetch(`/api/chat/projects?user_id=${userId}`);
        const data = await res.json();
        if (!data.error) setProjects(data);
      } catch (err) {
        console.error("❌ Error al obtener proyectos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  // 🔹 Crear nuevo proyecto
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return alert("Por favor ingresa un nombre para el proyecto");
    if (!userId) return alert("Usuario no autenticado");

    try {
      const res = await fetch("/api/chat/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: newProjectName,
          description: newProjectDesc,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      console.log("✅ Proyecto creado:", data.project);

      // 🧠 Guardar el proyecto activo en localStorage
      localStorage.setItem(
        "activeProject",
        JSON.stringify({
          id: data.project.id,
          name: data.project.title,
        })
      );

      // ✅ Redirigir al flujo de expertos
      router.push(`/experts`);
    } catch (err) {
      console.error("❌ Error al crear proyecto:", err);
      alert("Hubo un error al crear el proyecto");
    }
  };

  // 🔹 Seleccionar un proyecto existente
  const handleSelectProject = (project: Project) => {
    localStorage.setItem(
      "activeProject",
      JSON.stringify({ id: project.id, name: project.title })
    );
    router.push(`/expert-dashboard`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-2">
          📁 Tus proyectos
        </h1>
        {userEmail && (
          <p className="text-center text-gray-400 text-sm mb-8">
            Sesión activa: {userEmail}
          </p>
        )}

        {/* Crear nuevo proyecto */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Crear nuevo proyecto</h2>
          <input
            type="text"
            placeholder="Nombre del proyecto"
            className="w-full p-3 mb-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <textarea
            placeholder="Descripción (opcional)"
            className="w-full p-3 mb-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
            value={newProjectDesc}
            onChange={(e) => setNewProjectDesc(e.target.value)}
          />
          <button
            onClick={handleCreateProject}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-all"
          >
            Crear proyecto
          </button>
        </div>

        {/* Lista de proyectos existentes */}
        <h2 className="text-xl font-semibold mb-4">Proyectos existentes</h2>
        {loading ? (
          <p className="text-gray-400 text-center">Cargando...</p>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProject(p)}
                className="bg-gray-800 hover:bg-gray-700 cursor-pointer p-5 rounded-xl shadow-lg transition-all border border-gray-700"
              >
                <h3 className="text-lg font-semibold text-blue-400">{p.title}</h3>
                <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                  {p.description || "Sin descripción"}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Creado: {new Date(p.created_at).toLocaleDateString()}
                </p>
                {p.updated_at && (
                  <p className="text-gray-400 text-xs mt-1">
                    Último avance: {new Date(p.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">
            No tienes proyectos aún. ¡Crea el primero!
          </p>
        )}
      </div>
    </div>
  );
}
