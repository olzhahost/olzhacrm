import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import { createObject } from "@/lib/actions/objects";
import { redirect } from "next/navigation";
import type { Stage, Client, Employee } from "@/types/database";

export default async function NewObjectPage() {
  const employee = await requireEmployee();
  if (!can(employee, "objects.create")) {
    redirect("/objects");
  }

  const supabase = createClient();
  const [{ data: stages }, { data: clients }, { data: gips }] = await Promise.all([
    supabase.from("stages").select("*").order("sort_order") as unknown as Promise<{ data: Stage[] }>,
    supabase.from("clients").select("id, name").order("name") as unknown as Promise<{ data: Client[] }>,
    supabase
      .from("employees")
      .select("id, full_name")
      .in("role", ["gip", "director"])
      .order("full_name") as unknown as Promise<{ data: Employee[] }>,
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Новый объект проектирования</h1>

      <form action={createObject} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="code">
              Внутренний номер
            </label>
            <input id="code" name="code" className="input" placeholder="2026-014" />
          </div>
          <div>
            <label className="label" htmlFor="stage_id">
              Начальная стадия
            </label>
            <select id="stage_id" name="stage_id" required className="input">
              {stages?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="name">
            Название объекта *
          </label>
          <input id="name" name="name" required className="input" placeholder="Жилой комплекс «Алатау», 2 очередь" />
        </div>

        <div>
          <label className="label" htmlFor="address">
            Адрес строительства
          </label>
          <input id="address" name="address" className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="client_id">
              Заказчик
            </label>
            <select id="client_id" name="client_id" className="input">
              <option value="">— не выбран —</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="gip_id">
              Ответственный ГИП
            </label>
            <select id="gip_id" name="gip_id" className="input">
              <option value="">— не назначен —</option>
              {gips?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="planned_start">
              Начало работ
            </label>
            <input id="planned_start" name="planned_start" type="date" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="planned_finish">
              Плановая сдача
            </label>
            <input id="planned_finish" name="planned_finish" type="date" className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="budget">
            Сумма договора (тг)
          </label>
          <input id="budget" name="budget" type="number" step="0.01" className="input" />
        </div>

        <div>
          <label className="label" htmlFor="description">
            Описание / примечания
          </label>
          <textarea id="description" name="description" rows={3} className="input" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Создать объект
          </button>
          <a href="/objects" className="btn-secondary">
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
}
