import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireEmployee, can } from "@/lib/auth";
import type { Letter, ProjectObject } from "@/types/database";

type LetterRow = Letter & { objects: Pick<ProjectObject, "name"> | null };

export default async function LettersPage({
  searchParams,
}: {
  searchParams: { direction?: string };
}) {
  const employee = await requireEmployee();
  const supabase = createClient();

  let query = supabase
    .from("letters")
    .select("*, objects(name)")
    .order("letter_date", { ascending: false });

  if (searchParams.direction === "incoming" || searchParams.direction === "outgoing") {
    query = query.eq("direction", searchParams.direction);
  }

  const { data: letters } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Журнал писем</h1>
          <p className="text-sm text-gray-500 mt-1">Входящая и исходящая корреспонденция</p>
        </div>
        {can(employee, "letters.manage") && (
          <Link href="/letters/new" className="btn-primary">
            + Зарегистрировать письмо
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <Link href="/letters" className={`btn-secondary ${!searchParams.direction ? "bg-gray-100" : ""}`}>
          Все
        </Link>
        <Link href="/letters?direction=incoming" className={`btn-secondary ${searchParams.direction === "incoming" ? "bg-gray-100" : ""}`}>
          Входящие
        </Link>
        <Link href="/letters?direction=outgoing" className={`btn-secondary ${searchParams.direction === "outgoing" ? "bg-gray-100" : ""}`}>
          Исходящие
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>№</th>
              <th>Дата</th>
              <th>Тип</th>
              <th>Тема</th>
              <th>Объект</th>
              <th>Контрагент</th>
            </tr>
          </thead>
          <tbody>
            {(letters as LetterRow[] | null)?.map((l) => (
              <tr key={l.id}>
                <td className="font-mono text-xs">{l.registry_number}</td>
                <td>{l.letter_date}</td>
                <td>
                  <span className={`badge ${l.direction === "incoming" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                    {l.direction === "incoming" ? "Входящее" : "Исходящее"}
                  </span>
                </td>
                <td>{l.subject}</td>
                <td>{l.objects?.name ?? "—"}</td>
                <td>{l.counterparty ?? "—"}</td>
              </tr>
            ))}
            {letters?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  Писем пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
