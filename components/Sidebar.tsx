// Серверные хелперы авторизации. Используются в Server Components
// страниц, чтобы получить текущего сотрудника (с его ролью из public.employees).
// ВАЖНО: этот файл импортирует next/headers (через lib/supabase/server) и
// поэтому годится только для серверного кода. Для клиентских компонентов
// ("use client") используйте @/lib/permissions напрямую.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";

export async function getCurrentEmployee(): Promise<Employee | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.id)
    .single();

  return (employee as Employee) ?? null;
}

// Для Server Components, где отсутствие сессии должно редиректить на /login
// (сама защита уже стоит в middleware, это — подстраховка + получение данных).
export async function requireEmployee(): Promise<Employee> {
  const employee = await getCurrentEmployee();
  if (!employee) {
    redirect("/login");
  }
  return employee as Employee;
}

// Реэкспорт для обратной совместимости — серверные страницы могут
// по-прежнему импортировать can/ROLE_LABELS из "@/lib/auth".
export { can, ROLE_LABELS } from "@/lib/permissions";
