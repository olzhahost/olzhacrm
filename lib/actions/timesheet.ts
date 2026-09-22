"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Находит или создаёт табель сотрудника на месяц и возвращает его id.
export async function getOrCreateTimesheet(employeeId: string, year: number, month: number) {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from("timesheets")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("period_year", year)
    .eq("period_month", month)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("timesheets")
    .insert({ employee_id: employeeId, period_year: year, period_month: month })
    .select("id")
    .single();

  if (error) throw new Error(`Не удалось создать табель: ${error.message}`);
  return created!.id as string;
}

export async function saveTimesheetEntry(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const timesheetId = formData.get("timesheet_id") as string;
  const workDate = formData.get("work_date") as string;
  const objectId = (formData.get("object_id") as string) || null;
  const hours = Number(formData.get("hours"));
  const entryType = (formData.get("entry_type") as string) || "work";

  const { error } = await supabase.from("timesheet_entries").upsert(
    {
      timesheet_id: timesheetId,
      work_date: workDate,
      object_id: objectId,
      hours,
      entry_type: entryType,
    },
    { onConflict: "timesheet_id,work_date,object_id" }
  );

  if (error) throw new Error(`Не удалось сохранить запись табеля: ${error.message}`);

  revalidatePath("/timesheet");
}

export async function submitTimesheet(timesheetId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("timesheets")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", timesheetId);

  if (error) throw new Error(`Не удалось отправить табель на утверждение: ${error.message}`);
  revalidatePath("/timesheet");
}

export async function approveTimesheet(timesheetId: string, approve: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("timesheets")
    .update({
      status: approve ? "approved" : "rejected",
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", timesheetId);

  if (error) throw new Error(`Не удалось обновить статус табеля: ${error.message}`);
  revalidatePath("/timesheet");
}
