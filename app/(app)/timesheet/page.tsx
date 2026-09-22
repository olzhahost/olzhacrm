import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import { getOrCreateTimesheet } from "@/lib/actions/timesheet";
import TimesheetRow from "@/components/TimesheetRow";
import { SubmitTimesheetButton, ApproveTimesheetButtons } from "@/components/TimesheetActions";
import type { Employee, ProjectObject, Timesheet, TimesheetEntry } from "@/types/database";

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  submitted: "На утверждении",
  approved: "Утверждён",
  rejected: "Отклонён",
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default async function TimesheetPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string; employee_id?: string };
}) {
  const currentEmployee = await requireEmployee();
  const supabase = createClient();

  const now = new Date();
  const year = Number(searchParams.year) || now.getFullYear();
  const month = Number(searchParams.month) || now.getMonth() + 1;

  const isApprover = can(currentEmployee, "timesheet.approve");
  const targetEmployeeId = isApprover && searchParams.employee_id ? searchParams.employee_id : currentEmployee.id;

  const [{ data: employees }, { data: objects }] = await Promise.all([
    isApprover
      ? (supabase.from("employees").select("id, full_name").eq("is_active", true).order("full_name") as unknown as Promise<{ data: Pick<Employee, "id" | "full_name">[] }>)
      : Promise.resolve({ data: [] as Pick<Employee, "id" | "full_name">[] }),
    supabase.from("objects").select("id, name").eq("is_archived", false).order("name") as unknown as Promise<{ data: Pick<ProjectObject, "id" | "name">[] }>,
  ]);

  const timesheetId = await getOrCreateTimesheet(targetEmployeeId, year, month);

  const { data: timesheet } = (await supabase
    .from("timesheets")
    .select("*")
    .eq("id", timesheetId)
    .single()) as unknown as { data: Timesheet };

  const { data: entries } = (await supabase
    .from("timesheet_entries")
    .select("*")
    .eq("timesheet_id", timesheetId)) as unknown as { data: TimesheetEntry[] };

  const entriesByDate = new Map((entries ?? []).map((e) => [e.work_date, e]));

  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return {
      date: d.toISOString().slice(0, 10),
      weekday: WEEKDAYS[d.getDay()],
    };
  });

  const totalHours = (entries ?? []).reduce((sum, e) => sum + Number(e.hours), 0);

  const isOwnTimesheet = targetEmployeeId === currentEmployee.id;
  const readOnly = !isOwnTimesheet && !isApprover ? true : timesheet.status === "approved" || (isOwnTimesheet && timesheet.status === "submitted");

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Табель учёта рабочего времени</h1>
          <p className="text-sm text-gray-500 mt-1">
            {month}/{year} · Итого часов: {totalHours} · Статус:{" "}
            <span className="font-medium">{STATUS_LABELS[timesheet.status]}</span>
          </p>
        </div>
      </div>

      <form method="get" className="flex gap-3 mb-4 items-end">
        <div>
          <label className="label">Год</label>
          <input type="number" name="year" defaultValue={year} className="input w-24" />
        </div>
        <div>
          <label className="label">Месяц</label>
          <input type="number" name="month" min={1} max={12} defaultValue={month} className="input w-20" />
        </div>
        {isApprover && (
          <div>
            <label className="label">Сотрудник</label>
            <select name="employee_id" defaultValue={targetEmployeeId} className="input">
              {employees?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn-secondary">
          Показать
        </button>
      </form>

      <div className="card overflow-hidden mb-4">
        <table className="data-table w-full">
          <tbody>
            {days.map((d) => (
              <TimesheetRow
                key={d.date}
                timesheetId={timesheetId}
                date={d.date}
                weekday={d.weekday}
                objects={objects ?? []}
                existing={entriesByDate.get(d.date)}
                readOnly={readOnly}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        {isOwnTimesheet && timesheet.status === "draft" && (
          <SubmitTimesheetButton timesheetId={timesheet.id} />
        )}
        {isApprover && timesheet.status === "submitted" && (
          <ApproveTimesheetButtons timesheetId={timesheet.id} />
        )}
      </div>
    </div>
  );
}
