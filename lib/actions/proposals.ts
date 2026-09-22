"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ProposalItemInput {
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export async function createProposal(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const itemsRaw = formData.get("items") as string;
  const items: ProposalItemInput[] = itemsRaw ? JSON.parse(itemsRaw) : [];
  const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);

  const { data: proposal, error } = await supabase
    .from("commercial_proposals")
    .insert({
      number: formData.get("number") as string,
      proposal_date: formData.get("proposal_date") as string,
      client_id: (formData.get("client_id") as string) || null,
      object_id: (formData.get("object_id") as string) || null,
      title: formData.get("title") as string,
      total_amount: totalAmount,
      valid_until: (formData.get("valid_until") as string) || null,
      status: "draft",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Не удалось создать КП: ${error.message}`);

  if (items.length > 0) {
    const rows = items.map((it, idx) => ({
      proposal_id: proposal!.id,
      sort_order: idx,
      description: it.description,
      unit: it.unit || "усл.",
      quantity: it.quantity,
      unit_price: it.unit_price,
    }));
    const { error: itemsError } = await supabase.from("commercial_proposal_items").insert(rows);
    if (itemsError) throw new Error(`КП создано, но позиции не сохранены: ${itemsError.message}`);
  }

  revalidatePath("/proposals");
  redirect(`/proposals/${proposal!.id}`);
}

export async function updateProposalStatus(proposalId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("commercial_proposals")
    .update({ status })
    .eq("id", proposalId);

  if (error) throw new Error(`Не удалось изменить статус: ${error.message}`);

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/proposals");
}
