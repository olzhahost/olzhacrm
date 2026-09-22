"use client";

import { useTransition } from "react";
import { updateEmployeeRole, toggleEmployeeActive } from "@/lib/actions/employees";
import { ROLE_LABELS } from "@/lib/auth";
import type { EmployeeRole } from "@/types/database";

export default function EmployeeRoleSelect({
  employeeId,
  role,
  isActive,
}: {
  employeeId: string;
  role: EmployeeRole;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3">
      <select
        className="input text-xs py-1"
        defaultValue={role}
        disabled={pending}
        onChange={(e) => startTransition(() => updateEmployeeRole(employeeId, e.target.value as EmployeeRole))}
      >
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        className="text-xs text-gray-400 hover:text-gray-700"
        disabled={pending}
        onClick={() => startTransition(() => toggleEmployeeActive(employeeId, !isActive))}
      >
        {isActive ? "Деактивировать" : "Активировать"}
      </button>
    </div>
  );
}
