import type { Stage } from "@/types/database";

export default function StageBadge({ stage }: { stage: Pick<Stage, "name" | "color"> }) {
  return (
    <span
      className="badge"
      style={{
        backgroundColor: `${stage.color}1a`, // ~10% opacity
        color: stage.color,
      }}
    >
      {stage.name}
    </span>
  );
}
