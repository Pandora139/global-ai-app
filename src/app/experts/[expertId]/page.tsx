import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function ExpertDetailPage(props: {
  params: Promise<{ expertId: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const { expertId } = await props.params;
  const { project } = await props.searchParams;

  // 🟢 Obtener datos del experto principal
  const { data: expert, error: expertError } = await supabase
    .from("experts")
    .select("key, name, description, avatar_url")
    .eq("key", expertId)
    .single();

  if (expertError || !expert) {
    console.error("❌ Error al obtener experto:", expertError);
    notFound();
  }

  // 🟣 Obtener sub-expertos (menús de opciones)
  const { data: subExperts, error: subError } = await supabase
    .from("sub_experts")
    .select("id, title, description")
    .eq("expert_id", expert.key)
    .eq("is_active", true);

  if (subError) {
    console.error("⚠️ Error al obtener sub-expertos:", subError);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Encabezado del experto */}
        <div className="flex items-center gap-6 mb-10">
          {expert.avatar_url && (
            <img
              src={expert.avatar_url}
              alt={expert.name}
              className="w-20 h-20 rounded-full border-2 border-blue-500 shadow-md"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-blue-400">{expert.name}</h1>
            <p className="text-gray-300 mt-2">{expert.description}</p>

            {project && (
              <p className="text-sm mt-3 text-gray-400">
                🗂 Proyecto activo:{" "}
                <span className="font-semibold text-blue-300">{project}</span>
              </p>
            )}
          </div>
        </div>

        {/* Sub-expertos */}
        <h2 className="text-2xl font-semibold mb-6 text-gray-200">
          Selecciona una acción para continuar 👇
        </h2>

        {subExperts && subExperts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subExperts.map((sub) => (
              <Link
                key={sub.id}
                href={`/chat/${sub.id}?project=${project || ""}`}
                className="block bg-gray-800 hover:bg-blue-900/40 transition rounded-xl border border-gray-700 p-5 shadow-md"
              >
                <h3 className="text-lg font-semibold text-blue-300 mb-2">
                  {sub.title}
                </h3>
                <p className="text-gray-400 text-sm">{sub.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No hay opciones disponibles todavía.</p>
        )}
      </div>
    </div>
  );
}
