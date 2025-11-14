"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        // 🔹 Inicio de sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data?.user) router.push("/nexus-dashboard");
      } else {
        // 🔹 Registro de nuevo usuario
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setSuccess(
          "📩 Se ha enviado un enlace de verificación a tu correo. Revísalo para activar tu cuenta."
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-400 mb-6">
          {isLogin ? "Inicia sesión" : "Crea una cuenta"}
        </h1>

        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:ring-2 focus:ring-blue-500 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/40 p-2 rounded-md">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-400 text-sm text-center bg-green-900/30 p-2 rounded-md">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition-all disabled:opacity-70"
          >
            {loading
              ? isLogin
                ? "Verificando..."
                : "Enviando enlace..."
              : isLogin
              ? "Entrar"
              : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            className="text-blue-400 underline"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
}
