// Modules
import { useState } from "react";

// Types
import type { Objective } from "@/types";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

// Utils
import { assignObjectiveColor } from "../utils/objectivePalette";

interface ObjectiveManagerProps {
  objectives: Objective[];
  onCreate: (newObjective: Objective) => Promise<Objective>;
  onDelete: (id: string) => void;
  onUpdate: (
    id: string,
    label: string,
    description: string,
  ) => Promise<Objective>;
}

export default function ObjectiveManager({
  objectives,
  onCreate,
  onDelete,
  onUpdate,
}: ObjectiveManagerProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const safeObjectives = objectives ?? [];

  const handleCreate = () => {
    if (!label.trim()) return;
    const existingColors = objectives.map((o) => o.color);
    const newObj = {
      id: crypto.randomUUID(),
      label,
      description,
      color: assignObjectiveColor(existingColors),
      createdAt: new Date().toISOString(),
    };
    onCreate(newObj);
    setLabel("");
    setDescription("");
  };

  const startEdit = (o: Objective) => {
    setEditingId(o.id);
    setEditLabel(o.label);
    setEditDesc(o.description);
  };

  const commitEdit = () => {
    if (!editingId || !editLabel.trim()) return;
    onUpdate(editingId, editLabel, editDesc);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Create form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
          New Objective
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">
              Short Label{" "}
              <span className="text-slate-600">(shown as pill)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Ramp, Win-Con, Removal..."
              maxLength={20}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">
              Description{" "}
              <span className="text-slate-600">
                (optional — define the goal)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this objective achieves in your deck..."
              rows={2}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors resize-none"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!label.trim()}
            className="self-start bg-[#1971c2] hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Add Objective
          </button>
        </div>
      </div>

      {/* Objective list */}
      {safeObjectives.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">
          No objectives yet — add one above.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {safeObjectives.map((o) => (
            <div
              key={o.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
            >
              {editingId === o.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    maxLength={20}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={commitEdit}
                      className="text-sm font-semibold bg-[#1971c2] hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm text-slate-400 hover:text-white px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <ObjectivePill objective={o} size="md" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(o)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(o.id)}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {o.description && (
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {o.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
