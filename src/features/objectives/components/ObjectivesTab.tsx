// Modules
import { useState, useMemo } from "react";

// Types
import type { Deck, DeckEntry, Objective } from "@/types";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";
import ObjectiveManager from "@/features/objectives/components/ObjectiveManager";

interface ObjectivesTabProps {
  deck: Deck;
  objectives: Objective[];
  entries: DeckEntry[];
  onCreate: (label: string, description: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, label: string, description: string) => void;
  onUnassign: (cardId: string, objectiveId: string) => void;
}

type ObjectivesView = "manage" | "cards";

export default function ObjectivesTab({
  objectives,
  entries,
  onCreate,
  onDelete,
  onUpdate,
  onUnassign,
}: ObjectivesTabProps) {
  const [view, setView] = useState<ObjectivesView>("manage");

  const safeEntries = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        objectiveIds: e.objectiveIds ?? [],
      })),
    [entries],
  );

  const unassignedEntries = safeEntries.filter(
    (e) => e.objectiveIds.length === 0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-nav */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-lg self-start">
        {(["manage", "cards"] as ObjectivesView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
            style={{
              backgroundColor: view === v ? "#1971c2" : "transparent",
              color: view === v ? "#fff" : "#64748b",
            }}
          >
            {v === "manage" ? "Manage Objectives" : "Cards by Objective"}
          </button>
        ))}
      </div>

      {view === "manage" && (
        <ObjectiveManager
          objectives={objectives}
          onCreate={onCreate}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      )}

      {view === "cards" && (
        <div className="flex flex-col gap-8">
          {objectives.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">
              No objectives yet — create some in Manage Objectives.
            </p>
          )}

          {/* One section per objective */}
          {objectives.map((objective) => {
            const assigned = safeEntries.filter((e) =>
              e.objectiveIds.includes(objective.id),
            );
            return (
              <div key={objective.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ObjectivePill objective={objective} size="md" />
                  <span className="text-slate-500 text-xs">
                    {assigned.length} card{assigned.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {objective.description && (
                  <p className="text-slate-500 text-xs italic">
                    {objective.description}
                  </p>
                )}
                {assigned.length === 0 ? (
                  <p className="text-slate-600 text-xs pl-2">
                    No cards assigned to this objective yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {assigned.map((entry) => (
                      <div
                        key={entry.card.id}
                        className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm">
                            {entry.card.name}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {entry.card.type_line}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onUnassign(entry.card.id, objective.id)
                          }
                          className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unassigned bucket */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm font-semibold">
                Unassigned
              </span>
              <span className="text-slate-500 text-xs">
                {unassignedEntries.length} card
                {unassignedEntries.length !== 1 ? "s" : ""}
              </span>
            </div>
            {unassignedEntries.length === 0 ? (
              <p className="text-slate-600 text-xs pl-2">
                All cards have at least one objective assigned.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {unassignedEntries.map((entry) => (
                  <div
                    key={entry.card.id}
                    className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm">
                        {entry.card.name}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {entry.card.type_line}
                      </span>
                    </div>
                    <span className="text-xs text-slate-600 italic">
                      No objective
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
