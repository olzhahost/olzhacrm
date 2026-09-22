import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee } from "@/lib/auth";
import StageBadge from "@/components/StageBadge";
import type { ProjectObject, Stage } from "@/types/database";

type ObjectRow = ProjectObject & { stages: Pick<Stage, "name" | "color"> | null };

export default async function DashboardPage() {
  const employee = await requireEmployee();
  const supabase = createClient();

  const [
    { count: objectsCount },
    { count: activeContractsCount },
    { count: pendingProposalsCount },
    { data: recentObjects },
  ] = await Promise.all([
    supabase.from("objects").select("*", { count: "exact", head: true }).eq("is_archived", false),
    supabase.from("contracts").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("commercial_proposals").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase
      .from("objects")
      .select("*, stages(name, color)")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const stats = [
    { label: "Активных объектов", value: objectsCount ?? 0, href: "/objects" },
    { label: "Действующих договоров", value: activeContractsCount ?? 0, href: "/contracts" },
    { label: "КП на рассмотрении", value: pendingProposalsCount ?? 0, href: "/proposals" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">
        Добрый день, {employee.full_name.split(" ")[0]}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Краткая сводка по компании ОЛЖАПРОЕКТ</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:shadow-md transition-shadow">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Недавно обновлённые объекты</h2>
          <Link href="/objects" className="text-sm text-brand-600 hover:underline">
            Все объекты →
          </Link>
        </div>
        <ul className="divide-y divide-gray-100">
          {(recentObjects as ObjectRow[] | null)?.map((o) => (
            <li key={o.id} className="py-3 flex items-center justify-between">
              <Link href={`/objects/${o.id}`} className="font-medium text-gray-800 hover:text-brand-600">
                {o.name}
              </Link>
              {o.stages && <StageBadge stage={o.stages} />}
            </li>
          ))}
          {(!recentObjects || recentObjects.length === 0) && (
            <li className="py-6 text-center text-gray-400 text-sm">Объектов пока нет</li>
          )}
        </ul>
      </div>
    </div>
  );
}
