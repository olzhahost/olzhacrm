"use client";

import { useState, useTransition } from "react";
import { updateObjectStage } from "@/lib/actions/objects";
import type { Stage } from "@/types/database";

export default function StageChanger({
  objectId,
  currentStageId,
  stages,
  canEdit,
}: {
  objectId: string;
  currentStageId: string;
  stages: Stage[];
  canEdit: boolean;
}) {
  const [stageId, setStageId] = useState(currentStageId);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (!canEdit) {
    const current = stages.find((s) => s.id === currentStageId);
    return <p className="text-sm text-gray-600">Текущая стадия: {current?.name}</p>;
  }

  function handleSave() {
    startTransition(async () => {
      await updateObjectStage(objectId, stageId, comment || undefined);
      setSaved(true);
      setComment("");
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Стадия объекта</label>
        <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="input">
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Комментарий к смене стадии (необязательно)</label>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input"
          placeholder="Например: получено положительное заключение экспертизы"
        />
      </div>
      <button onClick={handleSave} disabled={pending} className="btn-primary">
        {pending ? "Сохранение..." : saved ? "Сохранено ✓" : "Сохранить стадию"}
      </button>
    </div>
  );
}
