"use client";

import { useTransition } from "react";
import { updateProposalStatus } from "@/lib/actions/proposals";

const STATUSES = [
  { value: "draft", label: "Черновик" },
  { value: "sent", label: "Отправлено" },
  { value: "accepted", label: "Принято" },
  { value: "rejected", label: "Отклонено" },
  { value: "expired", label: "Истекло" },
];

export default function ProposalStatusSelect({
  proposalId,
  currentStatus,
}: {
  proposalId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      className="input"
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => startTransition(() => updateProposalStatus(proposalId, e.target.value))}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
