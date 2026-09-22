import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import { createProposal } from "@/lib/actions/proposals";
import { redirect } from "next/navigation";
import ProposalItemsEditor from "@/components/ProposalItemsEditor";
import type { Client, ProjectObject } from "@/types/database";

export default async function NewProposalPage() {
  const employee = await requireEmployee();
  if (!can(employee, "proposals.manage")) redirect("/proposals");

  const supabase = createClient();
  const [{ data: clients }, { data: objects }] = await Promise.all([
    supabase.from("clients").select("id, name").order("name") as unknown as Promise<{ data: Pick<Client, "id" | "name">[] }>,
    supabase.from("objects").select("id, name").eq("is_archived", false).order("name") as unknown as Promise<{ data: Pick<ProjectObject, "id" | "name">[] }>,
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Новое коммерческое предложение</h1>

      <form action={createProposal} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="number">
              Номер КП *
            </label>
            <input id="number" name="number" required className="input" placeholder="КП-2026-014" />
          </div>
          <div>
            <label className="label" htmlFor="proposal_date">
              Дата
            </label>
            <input id="proposal_date" name="proposal_date" type="date" required defaultValue={today} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="title">
            Название / краткое описание *
          </label>
          <input id="title" name="title" required className="input" placeholder="Проектирование ЖК «Алатау», полный комплекс" />
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
        </div>

        <div>
          <label className="label" htmlFor="valid_until">
            Действительно до
          </label>
          <input id="valid_until" name="valid_until" type="date" className="input" />
        </div>

        <div>
          <label className="label">Состав работ и стоимость</label>
          <ProposalItemsEditor />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Создать КП
          </button>
          <a href="/proposals" className="btn-secondary">
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
}
