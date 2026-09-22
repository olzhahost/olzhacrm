"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Employee } from "@/types/database";
import { ROLE_LABELS } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Главная", icon: "🏠" },
  { href: "/objects", label: "Объекты", icon: "🏗️" },
  { href: "/letters", label: "Журнал писем", icon: "✉️" },
  { href: "/contracts", label: "Договоры", icon: "📄" },
  { href: "/orders", label: "Приказы", icon: "🗂️" },
  { href: "/proposals", label: "Коммерческие предложения", icon: "💼" },
  { href: "/timesheet", label: "Табель", icon: "🕒" },
  { href: "/employees", label: "Сотрудники", icon: "👥" },
];

export default function Sidebar({ employee }: { employee: Employee }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-100">
        <p className="font-bold text-gray-900">ОЛЖАПРОЕКТ</p>
        <p className="text-xs text-gray-400">CRM</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-4 py-4">
        <p className="text-sm font-medium text-gray-900 truncate">{employee.full_name}</p>
        <p className="text-xs text-gray-500">{ROLE_LABELS[employee.role]}</p>
        <button onClick={handleLogout} className="mt-3 text-xs text-gray-400 hover:text-gray-700">
          Выйти
        </button>
      </div>
    </aside>
  );
}
