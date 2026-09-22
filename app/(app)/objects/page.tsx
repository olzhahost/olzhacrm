import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import StageBadge from "@/components/StageBadge";
import type { ProjectObject, Stage, Client, Employee } from "@/types/database";

type ObjectRow = ProjectObject & {
  stages: Pick<Stage, "name" | "color"> | null;
  clients: Pick<Client, "name"> | null;
  gip: Pick<Employee, "full_name"> | null;
};

export default async function ObjectsPage() {
  const employee = await requireEmployee();
  const supabase = createClient();

  const { data: objects, error } = await supabase
    .from("objects")
    .select(
      "*, stages(name, color), clients(name), gip:employees!objects_gip_id_fkey(full_name)"
    )
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Объекты проектирования</h1>
          <p className="text-sm text-gray-500 mt-1">
            Все текущие объекты компании и их стадия готовности
          </p>
        </div>
        {can(employee, "objects.create") && (
          <Link href="/objects/new" className="btn-primary">
            + Новый объект
          </Link>
        )}
      </div>

      {error && (
        <div className="card p-4 text-sm text-red-600 mb-4">
          Ошибка загрузки: {error.message}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>№</th>
              <th>Название</th>
              <th>Заказчик</th>
              <th>ГИП</th>
              <th>Стадия</th>
              <th>Срок сдачи</th>
            </tr>
          </thead>
          <tbody>
            {(objects as ObjectRow[] | null)?.map((obj) => (
              <tr key={obj.id}>
                <td className="text-gray-500">{obj.code ?? "—"}</td>
                <td>
                  <Link href={`/objects/${obj.id}`} className="font-medium text-brand-600 hover:underline">
                    {obj.name}
                  </Link>
                  {obj.address && <p className="text-xs text-gray-400">{obj.address}</p>}
                </td>
                <td>{obj.clients?.name ?? "—"}</td>
                <td>{obj.gip?.full_name ?? "—"}</td>
                <td>{obj.stages && <StageBadge stage={obj.stages} />}</td>
                <td>{obj.planned_finish ?? "—"}</td>
              </tr>
            ))}
            {objects?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  Пока нет ни одного объекта
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
