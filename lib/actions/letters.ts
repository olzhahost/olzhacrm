"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createLetter(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    direction: formData.get("direction") as "incoming" | "outgoing",
    registry_number: formData.get("registry_number") as string,
    letter_date: formData.get("letter_date") as string,
    object_id: (formData.get("object_id") as string) || null,
    client_id: (formData.get("client_id") as string) || null,
    counterparty: (formData.get("counterparty") as string) || null,
    subject: formData.get("subject") as string,
    summary: (formData.get("summary") as string) || null,
    responsible_id: (formData.get("responsible_id") as string) || null,
    created_by: user.id,
  };

  const { error } = await supabase.from("letters").insert(payload);

  if (error) {
    throw new Error(`Не удалось зарегистрировать письмо: ${error.message}`);
  }

  revalidatePath("/letters");
  redirect("/letters");
}
