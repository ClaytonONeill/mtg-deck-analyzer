// Modules
import type { ReactNode } from "react";

// Types
import type { Objective } from "@/types";

interface ObjectiveAssignMenuProps {
  objectives: Objective[];
  onAssign: (objective: Objective) => void;
  triggerLabel: ReactNode;
  triggerClassName: string;
}

// Shared "Assign Objective" dropdown so every assignment surface looks the same.
// Callers keep their own data model and just adapt `onAssign`.
export default function ObjectiveAssignMenu({
  objectives,
  onAssign,
  triggerLabel,
  triggerClassName,
}: ObjectiveAssignMenuProps) {
  if (objectives.length === 0) return null;

  return (
    <div className="dropdown dropdown-top dropdown-start shrink-0">
      <div tabIndex={0} role="button" className={triggerClassName}>
        {triggerLabel}
      </div>
      {/* No custom z-index: daisyUI's dropdown-content already sits at 999 (see docs/design-tokens.md) */}
      <ul
        tabIndex={0}
        className="dropdown-content menu flex-nowrap max-h-80 overflow-y-auto p-2 shadow-2xl bg-base-200 rounded-box w-56 max-w-[calc(100vw-2rem)] border border-base-300 mb-2"
      >
        <li className="menu-title text-xs text-secondary uppercase tracking-widest">
          Assign Objective
        </li>
        {objectives.map((o) => (
          <li key={o.id}>
            <button onClick={() => onAssign(o)} className="text-xs py-2">
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
