// Modules
import { useState, useEffect, useCallback } from "react";

// Types
import type { Objective } from "@/types";

// Store
import { objectivesStore } from "@/store/objectivesStore";

export function useObjectives() {
  const [objectives, setObjectives] = useState<Objective[]>([]);

  useEffect(() => {
    let mounted = true;
    objectivesStore.getAllObjectives().then((data) => {
      if (mounted) setObjectives(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const addObjective = useCallback(async (objective: Objective) => {
    const tempObjective: Objective = {
      id: crypto.randomUUID(),
      label: objective.label,
      description: objective.description,
      color: objective.color,
      createdAt: new Date().toISOString(),
    };

    setObjectives((prev) => [tempObjective, ...prev]);

    try {
      const realObjective = await objectivesStore.addObjective(objective);
      setObjectives((prev) =>
        prev.map((e) => (e.id === tempObjective.id ? realObjective : e)),
      );
      return realObjective;
    } catch {
      setObjectives((prev) => prev.filter((e) => e.id !== tempObjective.id));
      throw new Error("Failed to add objective");
    }
  }, []);

  const deleteObjective = useCallback(
    async (objectiveId: string) => {
      const snapshot = objectives;
      setObjectives((prev) => prev.filter((e) => e.id !== objectiveId));
      try {
        await objectivesStore.deleteObjective(objectiveId);
      } catch {
        setObjectives(snapshot);
      }
    },
    [objectives],
  );

  const updateObjective = useCallback(
    async (
      objectiveId: string,
      updates: Pick<Objective, "label" | "description">,
    ) => {
      const snapshot = objectives;

      setObjectives((prev) =>
        prev.map((obj) =>
          obj.id === objectiveId ? { ...obj, ...updates } : obj,
        ),
      );

      try {
        const updated = await objectivesStore.updateObjective(
          objectiveId,
          updates,
        );

        setObjectives((prev) =>
          prev.map((obj) => (obj.id === objectiveId ? updated : obj)),
        );

        return updated;
      } catch {
        setObjectives(snapshot);
        throw new Error("Failed to update objective");
      }
    },
    [objectives],
  );

  return {
    objectives,
    addObjective,
    deleteObjective,
    updateObjective,
  };
}
