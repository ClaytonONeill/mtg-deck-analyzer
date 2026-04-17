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
    updates: Pick<Objective, "label" | "description">,
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
    onUpdate(editingId, {
      label: editLabel,
      description: editDesc,
    });
    setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-12">
      {/* Create Section */}
      <aside className="space-y-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-MD font-black uppercase tracking-[0.2em] text-primary">
            New Objective
          </h3>
          <p className="text-SM text-base-content/50 font-medium">
            Add a strategic tag for your cards.
          </p>
        </div>

        <div className="form-control w-full gap-4">
          <div className="space-y-1.5">
            <label className="label py-0">
              <span className="label-text-alt font-bold opacity-60">
                Short Label
              </span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Ramp"
              maxLength={20}
              className="input input-bordered w-full bg-base-200/50 focus:input-primary"
            />
          </div>

          <div className="space-y-1.5 my-3">
            <label className="label py-0">
              <span className="label-text-alt font-bold opacity-60">
                Description (Optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="textarea textarea-bordered w-full bg-base-200/50 focus:textarea-primary resize-none"
              placeholder="How does this help you win?"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!label.trim()}
            className="btn btn-primary btn-block shadow-lg shadow-primary/20"
          >
            Create Objective
          </button>
        </div>
      </aside>

      {/* List Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            Existing Objectives
          </h3>
          <div className="h-px flex-1 bg-base-content/5"></div>
        </div>

        {safeObjectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-base-200/30 rounded-3xl border-2 border-dashed border-base-content/5">
            <p className="text-base-content/30 font-medium italic">
              No objectives defined yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeObjectives.map((o) => (
              <div
                key={o.id}
                className="card bg-base-200/50 border border-base-content/5 transition-all hover:bg-base-200"
              >
                <div className="card-body p-5">
                  {editingId === o.id ? (
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="input input-sm input-bordered w-full"
                      />
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                        className="textarea textarea-sm textarea-bordered w-full resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={commitEdit}
                          className="btn btn-primary btn-xs px-4"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-ghost btn-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <ObjectivePill objective={o} size="md" />
                        <div className="dropdown dropdown-end">
                          <label
                            tabIndex={0}
                            className="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </label>
                          <ul
                            tabIndex={0}
                            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 border border-base-content/10"
                          >
                            <li>
                              <button
                                onClick={() => startEdit(o)}
                                className="text-xs"
                              >
                                Edit
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => onDelete(o.id)}
                                className="text-xs text-error"
                              >
                                Delete
                              </button>
                            </li>
                          </ul>
                        </div>
                      </div>
                      {o.description && (
                        <p className="mt-3 text-xs text-base-content/60 leading-relaxed line-clamp-2">
                          {o.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
