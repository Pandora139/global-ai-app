"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SubExpertsList({ params }: { params: { expertId: string } }) {
  const { expertId } = params;
  const router = useRouter();
  const [subExperts, setSubExperts] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("activeProject");
    if (stored) setActiveProject(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const fetchSubExperts = async () => {
      const { data, error } = await supabase
        .from("sub_experts")
        .select("id, title, description")
        .eq("expert_id", expertId);

      if (!error) setSubExperts(data || []);
      setLoading(false);
    };
    fetchSubExperts();
  }, [expertId]);

  const handleSubExpertClick = (subExpertId: string) => {
    router.push(`/chat/${subExpertId}?project=${activeProject?.id || ""}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-2xl font-bold text-center text-blue-400 mb-6">
          🧩 Subexpertos disponibles
        </h1>

        {loading ? (
          <p className="text-gray-400 text-center">Cargando subexpertos...</p>
        ) : subExperts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subExperts.map((sub) => (
              <div
                key={sub.id}
                onClick={() => handleSubExpertClick(sub.id)}
                className="bg-gray-800 p-6 rounded-xl shadow-md border border-gray-700 hover:bg-gray-700 transition cursor-pointer"
              >
                <h3 className="text-lg font-semibold text-blue-400">{sub.title}</h3>
                <p className="text-gray-300 text-sm mt-2 line-clamp-3">{sub.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center">
            No hay subexpertos registrados para este experto.
          </p>
        )}
      </div>
    </div>
  );
}
