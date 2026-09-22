import { requireEmployee } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

// Общий layout для всех защищённых разделов CRM (всё, что не /login).
// Middleware уже гарантирует, что сюда попадает только авторизованный
// пользователь; здесь мы дополнительно подгружаем его профиль (роль и т.д.)
// и рисуем боковое меню.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const employee = await requireEmployee();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar employee={employee} />
      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
