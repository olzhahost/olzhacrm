import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import StageBadge from "@/components/StageBadge";
import StageChanger from "@/components/StageChanger";
import type {
  ProjectObject,
  Stage,
  Client,
  Employee,
} from "@/types/database";

type StageHistoryRow = {
  id: string;
  comment: string | null;
  changed_at: string;
  from_stage: Pick<Stage, "name"> | null;
  to_stage: Pick<Stage, "name">;
  changed_by_employee: Pick<Employee, "full_name"> | null;
};

export default async function ObjectDetailPage({ params }: { params: { id: string } }) {
  const employee = await requireEmployee();
  const supabase = createClient();

  const { data: object } = await supabase
    .from("objects")
    .select(
      "*, stages(*), clients(*), gip:employees!objects_gip_id_fkey(full_name)"
    )
    .eq("id", params.id)
    .single();

  if (!object) notFound();

  const typedObject = object as ProjectObject & {
    stages: Stage;
    clients: Client | null;
    gip: Pick<Employee, "full_name"> | null;
  };

  const [{ data: stages }, { data: history }, { data: members }] = await Promise.all([
    supabase.from("stages").select("*").order("sort_order") as unknown as Promise<{ data: Stage[] }>,
    supabase
      .from("object_stage_history")
      .select(
        "id, comment, changed_at, from_stage:stages!object_stage_history_from_stage_id_fkey(name), to_stage:stages!object_stage_history_to_stage_id_fkey(name), changed_by_employee:employees(full_name)"
      )
      .eq("object_id", params.id)
      .order("changed_at", { ascending: false }) as unknown as Promise<{ data: StageHistoryRow[] }>,
    supabase
      .from("object_members")
      .select("employee_id, role_on_object, employees(full_name)")
      .eq("object_id", params.id),
  ]);

  const canEdit = can(employee, "objects.edit");

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">{typedObject.name}</h1>
          <StageBadge stage={typedObject.stages} />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {typedObject.code && <>№ {typedObject.code} · </>}
          {typedObject.address || "Адрес не указан"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Информация об объекте</h2>
            <dl className="grid grid-cols-2 gap-y-3 text-sm">
              <dt className="text-gray-500">Заказчик</dt>
              <dd>{typedObject.clients?.name ?? "—"}</dd>
              <dt className="text-gray-500">ГИП</dt>
              <dd>{typedObject.gip?.full_name ?? "—"}</dd>
              <dt className="text-gray-500">Начало работ</dt>
              <dd>{typedObject.planned_start ?? "—"}</dd>
              <dt className="text-gray-500">Плановая сдача</dt>
              <dd>{typedObject.planned_finish ?? "—"}</dd>
              <dt className="text-gray-500">Сумма договора</dt>
              <dd>{typedObject.budget ? `${typedObject.budget.toLocaleString("ru-RU")} тг` : "—"}</dd>
            </dl>
            {typedObject.description && (
              <p className="text-sm text-gray-600 mt-4 whitespace-pre-wrap">{typedObject.description}</p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">История стадий</h2>
            <ul className="space-y-3">
              {history?.map((h) => (
                <li key={h.id} className="text-sm border-l-2 border-gray-200 pl-3">
                  <p>
                    <span className="text-gray-400">{new Date(h.changed_at).toLocaleString("ru-RU")}</span>
                    {" — "}
                    {h.from_stage ? `${h.from_stage.name} → ` : ""}
                    <span className="font-medium">{h.to_stage.name}</span>
                    {h.changed_by_employee && (
                      <span className="text-gray-400"> ({h.changed_by_employee.full_name})</span>
                    )}
                  </p>
                  {h.comment && <p className="text-gray-600 mt-0.5">{h.comment}</p>}
                </li>
              ))}
              {(!history || history.length === 0) && (
                <p className="text-sm text-gray-400">История пока пуста</p>
              )}
            </ul>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Команда объекта</h2>
            <ul className="space-y-2 text-sm">
              {members?.map((m: any) => (
                <li key={m.employee_id} className="flex justify-between">
                  <span>{m.employees?.full_name}</span>
                  <span className="text-gray-400">{m.role_on_object ?? "—"}</span>
                </li>
              ))}
              {(!members || members.length === 0) && (
                <p className="text-gray-400">Команда ещё не назначена</p>
              )}
            </ul>
          </div>
        </div>

        <div className="col-span-1">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Управление стадией</h2>
            <StageChanger
              objectId={typedObject.id}
              currentStageId={typedObject.stage_id}
              stages={stages ?? []}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
