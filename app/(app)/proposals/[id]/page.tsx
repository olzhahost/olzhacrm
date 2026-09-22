import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import ProposalPdfButton from "@/components/ProposalPdfButton";
import ProposalStatusSelect from "@/components/ProposalStatusSelect";
import type { CommercialProposal, CommercialProposalItem, Client } from "@/types/database";

export default async function ProposalDetailPage({ params }: { params: { id: string } }) {
  const employee = await requireEmployee();
  const supabase = createClient();

  const { data: proposal } = await supabase
    .from("commercial_proposals")
    .select("*, clients(*)")
    .eq("id", params.id)
    .single();

  if (!proposal) notFound();

  const typedProposal = proposal as CommercialProposal & { clients: Client | null };

  const { data: items } = (await supabase
    .from("commercial_proposal_items")
    .select("*")
    .eq("proposal_id", params.id)
    .order("sort_order")) as unknown as { data: CommercialProposalItem[] };

  const canManage = can(employee, "proposals.manage");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">КП № {typedProposal.number}</h1>
          <p className="text-sm text-gray-500 mt-1">{typedProposal.title}</p>
        </div>
        <ProposalPdfButton
          number={typedProposal.number}
          title={typedProposal.title}
          date={typedProposal.proposal_date}
          clientName={typedProposal.clients?.name ?? "—"}
          items={items ?? []}
          total={typedProposal.total_amount ?? 0}
        />
      </div>

      <div className="card p-5 grid grid-cols-2 gap-y-3 text-sm">
        <span className="text-gray-500">Заказчик</span>
        <span>{typedProposal.clients?.name ?? "—"}</span>
        <span className="text-gray-500">Действительно до</span>
        <span>{typedProposal.valid_until ?? "—"}</span>
        <span className="text-gray-500">Статус</span>
        <span className="max-w-[200px]">
          {canManage ? (
            <ProposalStatusSelect proposalId={typedProposal.id} currentStatus={typedProposal.status} />
          ) : (
            typedProposal.status
          )}
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Описание</th>
              <th>Ед.</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((it) => (
              <tr key={it.id}>
                <td>{it.description}</td>
                <td>{it.unit}</td>
                <td>{it.quantity}</td>
                <td>{it.unit_price.toLocaleString("ru-RU")}</td>
                <td>{it.amount.toLocaleString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-right text-lg font-semibold">
        Итого: {(typedProposal.total_amount ?? 0).toLocaleString("ru-RU")} тг
      </p>
    </div>
  );
}
