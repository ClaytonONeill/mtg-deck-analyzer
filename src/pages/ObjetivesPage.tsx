// Hooks
import { useObjectives } from "@/hooks/useObjectives";

// Components
import ObjectiveManager from "@/features/objectives/components/ObjectiveManager";

export default function ObjectivesPage() {
  const { objectives, addObjective, deleteObjective, updateObjective } =
    useObjectives();

  return (
    <div className="min-h-screen bg-base-300">
      {/* Hero Header */}
      <div className="bg-base-100 border-b border-base-content/10 py-12 px-8 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-base-content tracking-tight mb-2">
            Objectives
          </h1>
          <p className="text-base-content/60 font-medium">
            Define and track the strategic pillars of your deck.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-12">
        <div className="card bg-base-100 shadow-xl border border-base-content/5">
          <div className="card-body p-8">
            <ObjectiveManager
              objectives={objectives}
              onCreate={addObjective}
              onDelete={deleteObjective}
              onUpdate={updateObjective}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
