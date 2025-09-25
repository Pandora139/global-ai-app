import Chat from "@/components/Chat";

export default async function ExpertoPage({
  searchParams,
}: {
  searchParams: Promise<{ nombre?: string; tipo?: string }>;
}) {
  const { nombre = "Invitado", tipo = "General" } = await searchParams;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Hola {nombre}, bienvenido al experto en {tipo}
      </h1>
      <Chat nombre={nombre} tipo={tipo} />
    </div>
  );
}
