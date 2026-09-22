"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createObject(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    code: (formData.get("code") as string) || null,
    name: formData.get("name") as string,
    address: (formData.get("address") as string) || null,
    client_id: (formData.get("client_id") as string) || null,
    gip_id: (formData.get("gip_id") as string) || null,
    stage_id: formData.get("stage_id") as string,
    planned_start: (formData.get("planned_start") as string) || null,
    planned_finish: (formData.get("planned_finish") as string) || null,
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
    description: (formData.get("description") as string) || null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("objects")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    // В реальном проекте — показать ошибку пользователю через useFormState.
    throw new Error(`Не удалось создать объект: ${error.message}`);
  }

  revalidatePath("/objects");
  redirect(`/objects/${data!.id}`);
}

export async function updateObjectStage(objectId: string, stageId: string, comment?: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("objects")
    .update({ stage_id: stageId })
    .eq("id", objectId);

  if (error) {
    throw new Error(`Не удалось изменить стадию: ${error.message}`);
  }

  // Если передан комментарий — дописываем его в последнюю запись истории,
  // созданную БД-триггером log_object_stage_change.
  if (comment) {
    const { data: lastHistory } = await supabase
      .from("object_stage_history")
      .select("id")
      .eq("object_id", objectId)
      .order("changed_at", { ascending: false })
      .limit(1)
      .single();

    if (lastHistory) {
      await supabase
        .from("object_stage_history")
        .update({ comment })
        .eq("id", lastHistory.id);
    }
  }

  revalidatePath(`/objects/${objectId}`);
  revalidatePath("/objects");
}

export async function addObjectMember(objectId: string, employeeId: string, roleOnObject?: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("object_members")
    .insert({ object_id: objectId, employee_id: employeeId, role_on_object: roleOnObject || null });

  if (error) {
    throw new Error(`Не удалось добавить сотрудника в команду: ${error.message}`);
  }

  revalidatePath(`/objects/${objectId}`);
}
