import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import { createOrder } from "@/lib/actions/contracts";
import { redirect } from "next/navigation";
import type { ProjectObject } from "@/types/database";

export default async function NewOrderPage() {
  const employee = await requireEmployee();
  if (!can(employee, "orders.manage")) redirect("/orders");

  const supabase = createClient();
  const { data: objects } = (await supabase
    .from("objects")
    .select("id, name")
    .eq("is_archived", false)
    .order("name")) as unknown as { data: Pick<ProjectObject, "id" | "name">[] };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Новый приказ</h1>

      <form action={createOrder} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="number">
              Номер приказа *
            </label>
            <input id="number" name="number" required className="input" placeholder="№12-к" />
          </div>
          <div>
            <label className="label" htmlFor="order_date">
              Дата
            </label>
            <input id="order_date" name="order_date" type="date" required defaultValue={today} className="input" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="order_type">
            Тип приказа
          </label>
          <select id="order_type" name="order_type" className="input" defaultValue="general">
            <option value="general">Общий</option>
            <option value="personnel">Кадровый</option>
            <option value="project">По объекту</option>
            <option value="other">Прочий</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="title">
            Заголовок *
          </label>
          <input id="title" name="title" required className="input" placeholder="О назначении ответственного ГИПа" />
        </div>

        <div>
          <label className="label" htmlFor="object_id">
            Связанный объект
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
          <label className="label" htmlFor="body">
            Текст приказа
          </label>
          <textarea id="body" name="body" rows={5} className="input" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary">
            Создать приказ
          </button>
          <a href="/orders" className="btn-secondary">
            Отмена
          </a>
        </div>
      </form>
    </div>
  );
}
