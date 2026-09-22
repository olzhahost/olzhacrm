import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import type { Contract, Client, ProjectObject } from "@/types/database";

type ContractRow = Contract & {
  clients: Pick<Client, "name"> | null;
  objects: Pick<ProjectObject, "name"> | null;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  active: "Действует",
  completed: "Завершён",
  terminated: "Расторгнут",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  active: "bg-green-50 text-green-700",
  completed: "bg-blue-50 text-blue-700",
  terminated: "bg-red-50 text-red-700",
};

export default async function ContractsPage() {
  const employee = await requireEmployee();
  const supabase = createClient();

  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, clients(name), objects(name)")
    .order("contract_date", { ascending: false });

  const total = (contracts as ContractRow[] | null)?.reduce((sum, c) => sum + (c.amount ?? 0), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Договоры</h1>
          <p className="text-sm text-gray-500 mt-1">
            Реестр договоров · на сумму {total.toLocaleString("ru-RU")} тг
          </p>
        </div>
        {can(employee, "contracts.manage") && (
          <Link href="/contracts/new" className="btn-primary">
            + Новый договор
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>№ договора</th>
              <th>Дата</th>
              <th>Заказчик</th>
              <th>Объект</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {(contracts as ContractRow[] | null)?.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.number}</td>
                <td>{c.contract_date}</td>
                <td>{c.clients?.name ?? "—"}</td>
                <td>{c.objects?.name ?? "—"}</td>
                <td>{c.amount ? `${c.amount.toLocaleString("ru-RU")} тг` : "—"}</td>
                <td>
                  <span className={`badge ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                </td>
              </tr>
            ))}
            {contracts?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  Договоров пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
