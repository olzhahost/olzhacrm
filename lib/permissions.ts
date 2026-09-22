// Права по ролям и человекочитаемые подписи ролей.
// Вынесено в отдельный файл БЕЗ серверных импортов (next/headers и т.п.),
// чтобы этот код можно было безопасно использовать и в клиентских
// компонентах ("use client", например Sidebar), и на сервере.
// Реальное разграничение доступа обеспечивает RLS в базе данных (см.
// supabase/migrations/0002_rls.sql) — это только для UI (скрыть кнопки/пункты меню).
import type { Employee, EmployeeRole } from "@/types/database";

const PERMISSIONS: Record<string, EmployeeRole[]> = {
  "objects.create": ["director", "gip"],
  "objects.edit": ["director", "gip"],
  "objects.delete": ["director"],
  "clients.edit": ["director", "gip", "accountant", "office_manager"],
  "stages.manage": ["director"],
  "letters.manage": ["director", "office_manager"],
  "contracts.manage": ["director", "accountant"],
  "orders.manage": ["director", "office_manager", "hr"],
  "proposals.manage": ["director", "accountant", "gip"],
  "employees.manage": ["director", "hr"],
  "timesheet.approve": ["director", "hr"],
};

export function can(employee: Pick<Employee, "role">, action: keyof typeof PERMISSIONS): boolean {
  const allowed = PERMISSIONS[action];
  return allowed ? allowed.includes(employee.role) : false;
}

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  director: "Директор",
  gip: "ГИП",
  engineer: "Инженер",
  accountant: "Бухгалтер",
  office_manager: "Офис-менеджер",
  hr: "Кадры (HR)",
  viewer: "Наблюдатель",
};
