// Hooks
import { useObjectives } from "@/hooks/useObjectives";

// Components
import ObjectiveManager from "@/features/objectives/components/ObjectiveManager";

export default function ObjectivesPage() {
  const { objectives, addObjective, deleteObjective, updateObjective } =
    useObjectives();

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">Objectives</h1>
          <p className="text-slate-400">
            Create and manage your deck objectives
          </p>
        </div>

        {/* Content */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <ObjectiveManager
            objectives={objectives}
            onCreate={addObjective}
            onDelete={deleteObjective}
            onUpdate={updateObjective}
          />
        </div>
      </div>
    </div>
  );
}
