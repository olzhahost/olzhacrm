import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import type { Order, ProjectObject } from "@/types/database";

type OrderRow = Order & { objects: Pick<ProjectObject, "name"> | null };

const TYPE_LABELS: Record<string, string> = {
  personnel: "Кадровый",
  general: "Общий",
  project: "По объекту",
  other: "Прочий",
};

export default async function OrdersPage() {
  const employee = await requireEmployee();
  const supabase = createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, objects(name)")
    .order("order_date", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Приказы</h1>
          <p className="text-sm text-gray-500 mt-1">Реестр внутренних распорядительных документов</p>
        </div>
        {can(employee, "orders.manage") && (
          <Link href="/orders/new" className="btn-primary">
            + Новый приказ
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Тип</th>
              <th>Заголовок</th>
              <th>Объект</th>
            </tr>
          </thead>
          <tbody>
            {(orders as OrderRow[] | null)?.map((o) => (
              <tr key={o.id}>
                <td className="font-medium">{o.number}</td>
                <td>{o.order_date}</td>
                <td>
                  <span className="badge bg-gray-100 text-gray-700">{TYPE_LABELS[o.order_type]}</span>
                </td>
                <td>{o.title}</td>
                <td>{o.objects?.name ?? "—"}</td>
              </tr>
            ))}
            {orders?.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  Приказов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
