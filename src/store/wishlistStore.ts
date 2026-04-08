// Types
import type { WishlistEntry, ScryfallCard, Objective } from "@/types";

// Lib
import { supabase } from "@/lib/supabase";

function rowToEntry(row: Record<string, unknown>): WishlistEntry {
  return {
    id: row.id as string,
    card: row.card as ScryfallCard,
    deckIds: (row.deck_ids as string[]) ?? [],
    note: (row.note as string) ?? "",
    addedAt: row.added_at as string,
    objectives: (row.objectives as Objective[]) ?? [],
  };
}

export const wishlistStore = {
  async getAll(): Promise<WishlistEntry[]> {
    const { data, error } = await supabase
      .from("wishlist_entries")
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      console.error("wishlistStore.getAll error:", error);
      return [];
    }

    return (data ?? []).map(rowToEntry);
  },

  async add(card: ScryfallCard, note: string = ""): Promise<WishlistEntry> {
    const { data: existing } = await supabase
      .from("wishlist_entries")
      .select("*")
      .eq("card->>id", card.id)
      .maybeSingle();

    if (existing) return rowToEntry(existing);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("wishlistStore.add: no authenticated user");

    const entry = {
      id: crypto.randomUUID(),
      user_id: user.id,
      card,
      deck_ids: [],
      objectives: [],
      note,
      added_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("wishlist_entries").insert(entry);

    if (error) console.error("wishlistStore.add error:", error);

    return {
      id: entry.id,
      card: entry.card,
      deckIds: entry.deck_ids,
      objectives: entry.objectives,
      note: entry.note,
      addedAt: entry.added_at,
    };
  },

  async remove(entryId: string): Promise<void> {
    const { error } = await supabase
      .from("wishlist_entries")
      .delete()
      .eq("id", entryId);

    if (error) console.error("wishlistStore.remove error:", error);
  },

  async tagDeck(entryId: string, deckId: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from("wishlist_entries")
      .select("deck_ids")
      .eq("id", entryId)
      .single();

    if (fetchError || !data) return;

    const current = (data.deck_ids as string[]) ?? [];
    if (current.includes(deckId)) return;

    const { error } = await supabase
      .from("wishlist_entries")
      .update({ deck_ids: [...current, deckId] })
      .eq("id", entryId);

    if (error) console.error("wishlistStore.tagDeck error:", error);
  },

  async untagDeck(entryId: string, deckId: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from("wishlist_entries")
      .select("deck_ids")
      .eq("id", entryId)
      .single();

    if (fetchError || !data) return;

    const current = (data.deck_ids as string[]) ?? [];

    const { error } = await supabase
      .from("wishlist_entries")
      .update({ deck_ids: current.filter((id) => id !== deckId) })
      .eq("id", entryId);

    if (error) console.error("wishlistStore.untagDeck error:", error);
  },

  async updateNote(entryId: string, note: string): Promise<void> {
    const { error } = await supabase
      .from("wishlist_entries")
      .update({ note })
      .eq("id", entryId);

    if (error) console.error("wishlistStore.updateNote error:", error);
  },

  async updateObjectives(
    entryId: string,
    objectives: Objective[],
  ): Promise<void> {
    const { error } = await supabase
      .from("wishlist_entries")
      .update({ objectives })
      .eq("id", entryId);

    if (error) console.error("wishlistStore.updateObjectives error:", error);
  },

  async addObjective(entryId: string, objective: Objective): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from("wishlist_entries")
      .select("objectives")
      .eq("id", entryId)
      .single();

    if (fetchError || !data) return;

    const current = (data.objectives as Objective[]) ?? [];
    if (current.find((o) => o.id === objective.id)) return;

    const { error } = await supabase
      .from("wishlist_entries")
      .update({ objectives: [...current, objective] })
      .eq("id", entryId);

    if (error) console.error("wishlistStore.addObjective error:", error);
  },

  async removeObjective(entryId: string, objectiveId: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from("wishlist_entries")
      .select("objectives")
      .eq("id", entryId)
      .single();

    if (fetchError || !data) return;

    const current = (data.objectives as Objective[]) ?? [];

    const { error } = await supabase
      .from("wishlist_entries")
      .update({ objectives: current.filter((o) => o.id !== objectiveId) })
      .eq("id", entryId);

    if (error) console.error("wishlistStore.removeObjective error:", error);
  },

  async getForDeck(deckId: string): Promise<WishlistEntry[]> {
    const { data, error } = await supabase
      .from("wishlist_entries")
      .select("*")
      .contains("deck_ids", [deckId]);

    if (error) {
      console.error("wishlistStore.getForDeck error:", error);
      return [];
    }

    return (data ?? []).map(rowToEntry);
  },
};
