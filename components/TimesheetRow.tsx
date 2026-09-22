"use client";

import { useTransition } from "react";
import { saveTimesheetEntry } from "@/lib/actions/timesheet";
import type { ProjectObject, TimesheetEntry } from "@/types/database";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  work: "Работа",
  sick: "Больничный",
  vacation: "Отпуск",
  absence: "Прогул",
  holiday: "Праздник/выходной",
};

export default function TimesheetRow({
  timesheetId,
  date,
  weekday,
  objects,
  existing,
  readOnly,
}: {
  timesheetId: string;
  date: string;
  weekday: string;
  objects: Pick<ProjectObject, "id" | "name">[];
  existing?: TimesheetEntry;
  readOnly: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const isWeekend = weekday === "Сб" || weekday === "Вс";

  function handleChange(formData: FormData) {
    startTransition(() => saveTimesheetEntry(formData));
  }

  return (
    <tr className={isWeekend ? "bg-gray-50" : ""}>
      <td className="whitespace-nowrap">
        {date} <span className="text-gray-400">{weekday}</span>
      </td>
      <td colSpan={3} className="p-0">
        <form action={handleChange} className="flex gap-2 items-center py-1">
          <input type="hidden" name="timesheet_id" value={timesheetId} />
          <input type="hidden" name="work_date" value={date} />

          <select name="object_id" defaultValue={existing?.object_id ?? ""} disabled={readOnly} className="input text-xs py-1">
            <option value="">— без объекта —</option>
            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <select name="entry_type" defaultValue={existing?.entry_type ?? "work"} disabled={readOnly} className="input text-xs py-1 w-32">
            {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="hours"
            step="0.5"
            min={0}
            max={24}
            defaultValue={existing?.hours ?? (isWeekend ? 0 : 8)}
            disabled={readOnly}
            className="input text-xs py-1 w-16"
          />

          {!readOnly && (
            <button type="submit" disabled={pending} className="text-xs text-brand-600 hover:underline">
              {pending ? "..." : "Сохранить"}
            </button>
          )}
        </form>
      </td>
    </tr>
  );
}
