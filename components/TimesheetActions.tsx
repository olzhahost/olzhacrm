"use client";

import { useTransition } from "react";
import { submitTimesheet, approveTimesheet } from "@/lib/actions/timesheet";

export function SubmitTimesheetButton({ timesheetId }: { timesheetId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="btn-primary"
      disabled={pending}
      onClick={() => startTransition(() => submitTimesheet(timesheetId))}
    >
      {pending ? "Отправка..." : "Отправить на утверждение"}
    </button>
  );
}

export function ApproveTimesheetButtons({ timesheetId }: { timesheetId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <button
        className="btn-primary"
        disabled={pending}
        onClick={() => startTransition(() => approveTimesheet(timesheetId, true))}
      >
        Утвердить
      </button>
      <button
        className="btn-secondary"
        disabled={pending}
        onClick={() => startTransition(() => approveTimesheet(timesheetId, false))}
      >
        Отклонить
      </button>
    </div>
  );
}
