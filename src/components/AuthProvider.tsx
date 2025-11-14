"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.push("/auth");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-lg">Cargando sesión...</div>
      </div>
    );

  return <>{children}</>;
}
