// src/app/api/test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service_role: process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "NO",
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "OK" : "NO",
    openai: process.env.OPENAI_API_KEY ? "OK" : "NO",
  });
}
