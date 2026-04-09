// Hooks
import { useObjectives } from "@/hooks/useObjectives";

export default function ObjectivesPage() {
  const { objectives } = useObjectives();

  return (
    <div className="flex flex-col gap-6">
      {objectives && <p>{JSON.stringify(objectives)}</p>}
    </div>
  );
}
