// Types
import type { Objective } from "@/types/index";

// Lib
import { supabase } from "@/lib/supabase";

function rowToObjective(row: Record<string, unknown>): Objective {
  return {
    id: row.id as string,
    label: row.label as string,
    description: row.description as string,
    color: row.color as string,
    createdAt: row.created_at as string,
  };
}

export const objectivesStore = {
  async getAllObjectives(): Promise<Objective[]> {
    const { data, error } = await supabase
      .from("objectives")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("deckStore.getAll error:", error);
      return [];
    }

    return (data ?? []).map(rowToObjective);
  },

  async addObjective(objective: Objective): Promise<Objective> {
    const { data: existingObjective } = await supabase
      .from("objectives")
      .select("*")
      .eq("objective->>id", objective.id)
      .maybeSingle();

    if (existingObjective) return rowToObjective(existingObjective);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("wishlistStore.add: no authenticated user");

    const newObjective = {
      id: crypto.randomUUID(),
      user_id: user,
      label: objective.label,
      description: objective.description,
      color: objective.color,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("wishlist_entries")
      .insert(newObjective);

    if (error) console.error("wishlistStore.add error:", error);

    return rowToObjective(newObjective);
  },
};
