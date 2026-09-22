import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can, ROLE_LABELS } from "@/lib/auth";
import EmployeeRoleSelect from "@/components/EmployeeRoleSelect";
import type { Employee, Department } from "@/types/database";

type EmployeeRow = Employee & { departments: Pick<Department, "name"> | null };

export default async function EmployeesPage() {
  const currentEmployee = await requireEmployee();
  const supabase = createClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("*, departments(name)")
    .order("full_name");

  const canManage = can(currentEmployee, "employees.manage");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Сотрудники</h1>
        <p className="text-sm text-gray-500 mt-1">
          Учётные записи и права доступа. Новые пользователи создаются в Supabase Auth
          (Dashboard → Authentication → Users) или через приглашение по email — профиль
          и роль назначаются здесь автоматически.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Должность</th>
              <th>Отдел</th>
              <th>Email</th>
              <th>Роль в системе</th>
            </tr>
          </thead>
          <tbody>
            {(employees as EmployeeRow[] | null)?.map((e) => (
              <tr key={e.id} className={!e.is_active ? "opacity-50" : ""}>
                <td className="font-medium">{e.full_name}</td>
                <td>{e.position ?? "—"}</td>
                <td>{e.departments?.name ?? "—"}</td>
                <td className="text-gray-500">{e.email}</td>
                <td>
                  {canManage ? (
                    <EmployeeRoleSelect employeeId={e.id} role={e.role} isActive={e.is_active} />
                  ) : (
                    ROLE_LABELS[e.role]
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
