import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import { createLetter } from "@/lib/actions/letters";
import { redirect } from "next/navigation";
import type { ProjectObject, Client, Employee } from "@/types/database";

export default async function NewLetterPage() {
  const employee = await requireEmployee();
  if (!can(employee, "letters.manage")) redirect("/letters");

  const supabase = createClient();
  const [{ data: objects }, { data: clients }, { data: employees }] = await Promise.all([
    supabase.from("objects").select("id, name").eq("is_archived", false).order("name") as unknown as Promise<{ data: Pick<ProjectObject, "id" | "name">[] }>,
    supabase.from("clients").select("id, name").order("name") as unknown as Promise<{ data: Pick<Client, "id" | "name">[] }>,
    supabase.from("employees").select("id, full_name").eq("is_active", true).order("full_name") as unknown as Promise<{ data: Pick<Employee, "id" | "full_name">[] }>,
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Регистрация письма</h1>

      <form action={createLetter} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="direction">
              Тип
            </label>
            <select id="direction" name="direction" required className="input">
              <option value="incoming">Входящее</option>
              <option value="outgoing">Исходящее</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="letter_date">
              Дата письма
            </label>
            <input id="letter_date" name="letter_date" type="date" required defaultValue={today} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="registry_number">
            Регистрационный номер *
          </label>
          <input id="registry_number" name="registry_number" required className="input" placeholder="ВХ-2026-014" />
        </div>

        <div>
          <label className="label" htmlFor="subject">
            Тема письма *
          </label>
          <input id="subject" name="subject" required className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div>
          <label className="label" htmlFor="counterparty">
            Контрагент (если не из справочника заказчиков)
          </label>
          <input id="counterparty" name="counterparty" className="input" />
        </div>

        <div>
          <label className="label" htmlFor="responsible_id">
            Ответственный
          </label>
          <select id="responsible_id" name="responsible_id" className="input">
            <option value="">— не назначен —</option>
            {employees?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="summary">
            Краткое содержание
          </label>
          <textarea id="summary" name="summary" rows={3} className="input" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Зарегистрировать
          </button>
          <a href="/letters" className="btn-secondary">
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
}
