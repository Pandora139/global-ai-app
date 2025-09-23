// src/lib/generateQuestions.ts
import { supabase } from "./supabaseClient";

export async function generateQuestions() {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Unexpected error fetching questions:", err);
    return [];
  }
}
