// Упрощённые типы таблиц БД. Соответствуют supabase/migrations/0001_init.sql.
// При желании их можно сгенерировать автоматически командой:
//   npx supabase gen types typescript --project-id <ID> > types/database.ts

export type EmployeeRole =
  | "director"
  | "gip"
  | "engineer"
  | "accountant"
  | "office_manager"
  | "hr"
  | "viewer";

export interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  role: EmployeeRole;
  department_id: string | null;
  phone: string | null;
  email: string | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  bin_iin: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Stage {
  id: string;
  code: string;
  name: string;
  sort_order: number;
  is_final: boolean;
  color: string;
}

export interface ProjectObject {
  id: string;
  code: string | null;
  name: string;
  address: string | null;
  client_id: string | null;
  gip_id: string | null;
  department_id: string | null;
  stage_id: string;
  planned_start: string | null;
  planned_finish: string | null;
  budget: number | null;
  description: string | null;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type LetterDirection = "incoming" | "outgoing";

export interface Letter {
  id: string;
  direction: LetterDirection;
  registry_number: string;
  letter_date: string;
  object_id: string | null;
  client_id: string | null;
  counterparty: string | null;
  subject: string;
  summary: string | null;
  responsible_id: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
}

export type ContractStatus = "draft" | "active" | "completed" | "terminated";

export interface Contract {
  id: string;
  number: string;
  contract_date: string;
  object_id: string | null;
  client_id: string;
  amount: number | null;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  file_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderType = "personnel" | "general" | "project" | "other";

export interface Order {
  id: string;
  number: string;
  order_date: string;
  order_type: OrderType;
  title: string;
  body: string | null;
  object_id: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
}

export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface CommercialProposal {
  id: string;
  number: string;
  proposal_date: string;
  client_id: string | null;
  object_id: string | null;
  title: string;
  total_amount: number | null;
  status: ProposalStatus;
  valid_until: string | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommercialProposalItem {
  id: string;
  proposal_id: string;
  sort_order: number;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected";

export interface Timesheet {
  id: string;
  employee_id: string;
  period_year: number;
  period_month: number;
  status: TimesheetStatus;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface TimesheetEntry {
  id: string;
  timesheet_id: string;
  work_date: string;
  object_id: string | null;
  hours: number;
  entry_type: "work" | "sick" | "vacation" | "absence" | "holiday";
  comment: string | null;
}

// Заглушка типа Database для @supabase/ssr generics.
// Замените на сгенерированный тип, когда проект будет развёрнут в Supabase.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
