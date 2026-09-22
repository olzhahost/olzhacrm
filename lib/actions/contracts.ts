"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createContract(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    number: formData.get("number") as string,
    contract_date: formData.get("contract_date") as string,
    object_id: (formData.get("object_id") as string) || null,
    client_id: formData.get("client_id") as string,
    amount: formData.get("amount") ? Number(formData.get("amount")) : null,
    status: (formData.get("status") as string) || "draft",
    start_date: (formData.get("start_date") as string) || null,
    end_date: (formData.get("end_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
    created_by: user.id,
  };

  const { error } = await supabase.from("contracts").insert(payload);
  if (error) throw new Error(`Не удалось создать договор: ${error.message}`);

  revalidatePath("/contracts");
  redirect("/contracts");
}

export async function createOrder(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    number: formData.get("number") as string,
    order_date: formData.get("order_date") as string,
    order_type: (formData.get("order_type") as string) || "general",
    title: formData.get("title") as string,
    body: (formData.get("body") as string) || null,
    object_id: (formData.get("object_id") as string) || null,
    created_by: user.id,
  };

  const { error } = await supabase.from("orders").insert(payload);
  if (error) throw new Error(`Не удалось создать приказ: ${error.message}`);

  revalidatePath("/orders");
  redirect("/orders");
}
