import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import { createContract } from "@/lib/actions/contracts";
import { redirect } from "next/navigation";
import type { Client, ProjectObject } from "@/types/database";

export default async function NewContractPage() {
  const employee = await requireEmployee();
  if (!can(employee, "contracts.manage")) redirect("/contracts");

  const supabase = createClient();
  const [{ data: clients }, { data: objects }] = await Promise.all([
    supabase.from("clients").select("id, name").order("name") as unknown as Promise<{ data: Pick<Client, "id" | "name">[] }>,
    supabase.from("objects").select("id, name").eq("is_archived", false).order("name") as unknown as Promise<{ data: Pick<ProjectObject, "id" | "name">[] }>,
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Новый договор</h1>

      <form action={createContract} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="number">
              Номер договора *
            </label>
            <input id="number" name="number" required className="input" placeholder="Д-2026-014" />
          </div>
          <div>
            <label className="label" htmlFor="contract_date">
              Дата заключения
            </label>
            <input id="contract_date" name="contract_date" type="date" required defaultValue={today} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="client_id">
            Заказчик *
          </label>
          <select id="client_id" name="client_id" required className="input">
            <option value="">— выберите —</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="object_id">
            Объект
          </label>
          <select id="object_id" name="object_id" className="input">
            <option value="">— не привязано —</option>
            {objects?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="amount">
              Сумма договора (тг)
            </label>
            <input id="amount" name="amount" type="number" step="0.01" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="status">
              Статус
            </label>
            <select id="status" name="status" className="input" defaultValue="draft">
              <option value="draft">Черновик</option>
              <option value="active">Действует</option>
              <option value="completed">Завершён</option>
              <option value="terminated">Расторгнут</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="start_date">
              Начало действия
            </label>
            <input id="start_date" name="start_date" type="date" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="end_date">
              Окончание действия
            </label>
            <input id="end_date" name="end_date" type="date" className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Примечания
          </label>
          <textarea id="notes" name="notes" rows={3} className="input" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Создать договор
          </button>
          <a href="/contracts" className="btn-secondary">
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
}
