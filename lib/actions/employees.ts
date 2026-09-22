"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EmployeeRole } from "@/types/database";

// Смена роли/должности сотрудника — доступно только director/hr (проверяется RLS в БД).
export async function updateEmployeeRole(employeeId: string, role: EmployeeRole) {
  const supabase = createClient();
  const { error } = await supabase.from("employees").update({ role }).eq("id", employeeId);
  if (error) throw new Error(`Не удалось изменить роль: ${error.message}`);
  revalidatePath("/employees");
}

export async function toggleEmployeeActive(employeeId: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase.from("employees").update({ is_active: isActive }).eq("id", employeeId);
  if (error) throw new Error(`Не удалось изменить статус сотрудника: ${error.message}`);
  revalidatePath("/employees");
}
