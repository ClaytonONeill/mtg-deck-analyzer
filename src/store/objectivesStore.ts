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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("objectivesStore.add: no authenticated user");

    const newObjective = {
      id: crypto.randomUUID(),
      user_id: user.id,
      label: objective.label,
      description: objective.description,
      color: objective.color,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("objectives")
      .insert(newObjective)
      .select()
      .single();

    if (error) {
      console.error("objectivesStore.add error:", error);
      throw error;
    }

    return rowToObjective(data);
  },

  async deleteObjective(objectiveId: string): Promise<void> {
    const { error } = await supabase
      .from("objectives")
      .delete()
      .eq("id", objectiveId);

    if (error) console.error("Error removing objective from database:", error);
  },

  async updateObjective(
    objectiveId: string,
    updates: Pick<Objective, "label" | "description">,
  ): Promise<Objective> {
    const { data, error } = await supabase
      .from("objectives")
      .update({
        label: updates.label,
        description: updates.description,
      })
      .eq("id", objectiveId)
      .select()
      .single();

    if (error) {
      console.error("objectivesStore.update error:", error);
      throw error;
    }

    return rowToObjective(data);
  },
};
