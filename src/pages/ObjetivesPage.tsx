// Hooks
import { useObjectives } from "@/hooks/useObjectives";

// Components
import ObjectiveManager from "@/features/objectives/components/ObjectiveManager";

export default function ObjectivesPage() {
  const { objectives, addObjective, deleteObjective, updateObjective } =
    useObjectives();

  return (
    <div className="flex flex-col gap-6">
      <ObjectiveManager
        objectives={objectives}
        onCreate={addObjective}
        onDelete={deleteObjective}
        onUpdate={updateObjective}
      />
    </div>
  );
}
