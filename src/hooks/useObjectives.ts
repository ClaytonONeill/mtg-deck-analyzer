// Modules
import { useState, useEffect } from "react";

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
  });

  return {
    objectives,
  };
}
