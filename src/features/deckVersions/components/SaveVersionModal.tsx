// Modules
import { useState } from "react";

type SaveMode = "new" | "update";

interface SaveVersionModalProps {
  /** "main" when viewing the main build, otherwise the id of the version
   * currently being viewed — the modal always targets whichever of these
   * is active, never an arbitrary other version (see useDeckVersions). */
  activeVersionId: "main" | string;
  activeVersionLabel: string;
  onSaveAsNew: (name: string, note: string) => void;
  onUpdateActive: () => void;
  onCancel: () => void;
}

export default function SaveVersionModal({
  activeVersionId,
  activeVersionLabel,
  onSaveAsNew,
  onUpdateActive,
  onCancel,
}: SaveVersionModalProps) {
  const isViewingVersion = activeVersionId !== "main";

  const [mode, setMode] = useState<SaveMode>(
    isViewingVersion ? "update" : "new",
  );
  const [name, setName] = useState("");
  const [note, setNote] = useState("");

  const handleSave = () => {
    if (mode === "new") {
      if (!name.trim()) return;
      onSaveAsNew(name, note);
    } else {
      onUpdateActive();
    }
  };

  return (
    <div className="modal modal-open backdrop-blur-sm">
      <div className="modal-box bg-base-100 border border-base-300 shadow-2xl max-w-md p-6 flex flex-col gap-6">
        <h2 className="text-xl font-bold">Save Version</h2>

        {isViewingVersion && (
          <div className="join w-full">
            <button
              onClick={() => setMode("update")}
              className={`join-item btn btn-sm flex-1 ${mode === "update" ? "btn-primary" : "btn-ghost bg-base-200"}`}
            >
              Update "{activeVersionLabel}"
            </button>
            <button
              onClick={() => setMode("new")}
              className={`join-item btn btn-sm flex-1 ${mode === "new" ? "btn-primary" : "btn-ghost bg-base-200"}`}
            >
              Branch as New
            </button>
          </div>
        )}

        {/* Update the active version */}
        {mode === "update" && isViewingVersion && (
          <div className="form-control w-full gap-2">
            <p className="text-xs opacity-70">
              New swaps will be appended to{" "}
              <span className="font-semibold">"{activeVersionLabel}"</span>'s
              history.
            </p>
          </div>
        )}

        {/* Save as new — branches off whatever is currently active */}
        {mode === "new" && (
          <div className="flex flex-col gap-4">
            {isViewingVersion && (
              <p className="text-xs opacity-70">
                This will branch a new version off{" "}
                <span className="font-semibold">"{activeVersionLabel}"</span>,
                including its existing changes plus your new swaps.
              </p>
            )}
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
            disabled={mode === "new" ? !name.trim() : false}
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
