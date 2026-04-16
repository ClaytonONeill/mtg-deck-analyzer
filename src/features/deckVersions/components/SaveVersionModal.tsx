// Modules
import { useState } from "react";

// Types
import type { DeckVersion } from "@/types";

type SaveMode = "new" | "update";

interface SaveVersionModalProps {
  existingVersions: DeckVersion[];
  onSave: (name: string, note: string) => void;
  onUpdate: (versionId: string) => void;
  onCancel: () => void;
}

export default function SaveVersionModal({
  existingVersions,
  onSave,
  onUpdate,
  onCancel,
}: SaveVersionModalProps) {
  const [mode, setMode] = useState<SaveMode>(
    existingVersions.length > 0 ? "update" : "new",
  );
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    existingVersions[0]?.id ?? "",
  );

  const handleSave = () => {
    if (mode === "new") {
      if (!name.trim()) return;
      onSave(name, note);
    } else {
      if (!selectedVersionId) return;
      onUpdate(selectedVersionId);
    }
  };

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box bg-base-100 border border-base-300 shadow-2xl max-w-md p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold">Save Version</h2>

        {/* Mode toggle — using DaisyUI Join */}
        {existingVersions.length > 0 && (
          <div className="join w-full">
            <button
              onClick={() => setMode("update")}
              className={`join-item btn btn-sm flex-1 ${mode === "update" ? "btn-primary" : "btn-ghost bg-base-200"}`}
            >
              Update Existing
            </button>
            <button
              onClick={() => setMode("new")}
              className={`join-item btn btn-sm flex-1 ${mode === "new" ? "btn-primary" : "btn-ghost bg-base-200"}`}
            >
              Save as New
            </button>
          </div>
        )}

        {/* Update existing */}
        {mode === "update" && existingVersions.length > 0 && (
          <div className="form-control w-full gap-2">
            <label className="label py-0">
              <span className="label-text-alt font-bold opacity-60">
                SELECT VERSION
              </span>
            </label>
            <select
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              className="select select-bordered select-sm w-full bg-base-200"
            >
              {existingVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] opacity-50 italic">
              New swaps will be appended to this version's history.
            </p>
          </div>
        )}

        {/* Save as new */}
        {mode === "new" && (
          <div className="flex flex-col gap-4">
            <div className="form-control w-full gap-1.5">
              <label className="label py-0">
                <span className="label-text-alt font-bold opacity-60">
                  VERSION NAME
                </span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. More Ramp, Control Build..."
                className="input input-bordered input-sm w-full bg-base-200"
              />
            </div>
            <div className="form-control w-full gap-1.5">
              <label className="label py-0">
                <span className="label-text-alt font-bold opacity-60">
                  NOTE (OPTIONAL)
                </span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What are you trying to improve?"
                rows={2}
                className="textarea textarea-bordered w-full bg-base-200 resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="modal-action mt-2">
          <button onClick={onCancel} className="btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={mode === "new" ? !name.trim() : !selectedVersionId}
            className="btn btn-primary px-8"
          >
            {mode === "new" ? "Save Version" : "Update Version"}
          </button>
        </div>
      </div>

      {/* Click outside to close helper */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onCancel}>close</button>
      </form>
    </div>
  );
}
