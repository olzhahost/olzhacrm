import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import type { CommercialProposal, Client } from "@/types/database";

type ProposalRow = CommercialProposal & { clients: Pick<Client, "name"> | null };

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  accepted: "Принято",
  rejected: "Отклонено",
  expired: "Истекло",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-yellow-50 text-yellow-700",
};

export default async function ProposalsPage() {
  const employee = await requireEmployee();
  const supabase = createClient();

  const { data: proposals } = await supabase
    .from("commercial_proposals")
    .select("*, clients(name)")
    .order("proposal_date", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Коммерческие предложения</h1>
          <p className="text-sm text-gray-500 mt-1">Реестр КП для заказчиков</p>
        </div>
        {can(employee, "proposals.manage") && (
          <Link href="/proposals/new" className="btn-primary">
            + Новое КП
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Заказчик</th>
              <th>Название</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {(proposals as ProposalRow[] | null)?.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">
                  <Link href={`/proposals/${p.id}`} className="text-brand-600 hover:underline">
                    {p.number}
                  </Link>
                </td>
                <td>{p.proposal_date}</td>
                <td>{p.clients?.name ?? "—"}</td>
                <td>{p.title}</td>
                <td>{p.total_amount ? `${p.total_amount.toLocaleString("ru-RU")} тг` : "—"}</td>
                <td>
                  <span className={`badge ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                </td>
              </tr>
            ))}
            {proposals?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  Коммерческих предложений пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
