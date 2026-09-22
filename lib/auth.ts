// Серверные хелперы авторизации/прав. Используются в Server Components
// страниц, чтобы получить текущего сотрудника (с его ролью из public.employees)
// и скрыть в UI то, что RLS всё равно не даст сделать в БД.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeRole } from "@/types/database";

export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.id)
    .single();

  return (employee as Employee) ?? null;
}

// Для Server Components, где отсутствие сессии должно редиректить на /login
// (сама защита уже стоит в middleware, это — подстраховка + получение данных).
export async function requireEmployee(): Promise<Employee> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    redirect("/login");
  }
  return employee as Employee;
}

// Права по ролям — единая карта, чтобы не размазывать if/else по всему UI.
// Реальное разграничение обеспечивает RLS в БД; это — только для UI (скрыть кнопки/пункты меню).
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
