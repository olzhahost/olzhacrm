-- =========================================================================
-- OLZHAPROJECT CRM — базовая схема БД (Supabase / PostgreSQL)
-- Компания: ОЛЖАПРОЕКТ (проектирование зданий и сооружений)
-- =========================================================================
-- Модули:
--   1. Сотрудники и роли (авторизация, права доступа)
--   2. Объекты проектирования и стадии
--   3. Журнал писем (входящие/исходящие)
--   4. Договоры
--   5. Приказы
--   6. Коммерческие предложения
--   7. Табель учёта рабочего времени
-- =========================================================================

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. СПРАВОЧНИКИ: РОЛИ И ОТДЕЛЫ
-- -------------------------------------------------------------------------

-- Роли фиксированы enum'ом — так проще строить RLS-политики.
-- director      — директор, полный доступ ко всему
-- gip           — ГИП (главный инженер проекта), видит и ведёт "свои" объекты
-- engineer      — инженер/проектировщик, видит объекты, где он в команде
-- accountant    — бухгалтер, доступ к договорам, КП, табелю (без объектов)
-- office_manager— офис-менеджер/секретарь, ведёт журнал писем и приказы
-- hr            — кадры, ведёт сотрудников и табель
-- viewer        — только просмотр (например, учредитель)
create type public.employee_role as enum (
  'director',
  'gip',
  'engineer',
  'accountant',
  'office_manager',
  'hr',
  'viewer'
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

comment on table public.departments is 'Отделы компании (архитектурный, конструкторский, ОВиК, ЭОМ и т.д.)';

-- -------------------------------------------------------------------------
-- 2. СОТРУДНИКИ (профиль поверх auth.users)
-- -------------------------------------------------------------------------

create table public.employees (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  position text,                         -- должность (штатная), например "Инженер-конструктор"
  role public.employee_role not null default 'engineer',
  department_id uuid references public.departments(id) on delete set null,
  phone text,
  email text,
  hire_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.employees is 'Профили сотрудников, 1:1 с auth.users. Роль определяет права доступа.';

-- Триггер: при создании auth.users автоматически создаём "заглушку" employee
-- (реальные данные потом дозаполняет HR/директор через UI).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.employees (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    'viewer' -- по умолчанию минимальные права, роль назначает директор/HR
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Обновление updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 3. КЛИЕНТЫ (заказчики)
-- -------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- наименование заказчика (компания/физлицо)
  bin_iin text,                       -- БИН/ИИН
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------------------
-- 4. ОБЪЕКТЫ ПРОЕКТИРОВАНИЯ + СТАДИИ
-- -------------------------------------------------------------------------

-- Стадии храним не enum'ом, а справочником (таблица stages ниже) —
-- так директор сможет добавлять/переименовывать стадии без миграций БД.
create table public.stages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- 'application','contract','sketch','ar','kr', ...
  name text not null,               -- человекочитаемое имя на русском
  sort_order int not null default 0,
  is_final boolean not null default false, -- финальная стадия (сдан/закрыт)
  color text default '#6b7280'      -- цвет метки в UI (hex)
);

comment on table public.stages is 'Справочник стадий жизненного цикла объекта. Настраивается директором.';

insert into public.stages (code, name, sort_order, is_final, color) values
  ('application',        'Заявка / бриф',                 10, false, '#94a3b8'),
  ('contract',           'Договор заключается',            20, false, '#60a5fa'),
  ('sketch',             'Эскизный проект',                30, false, '#38bdf8'),
  ('ar',                 'АР (архитектурные решения)',     40, false, '#818cf8'),
  ('kr',                 'КР (конструктивные решения)',    50, false, '#a78bfa'),
  ('engineering_systems','Инженерные разделы (ОВиК/ВК/ЭОМ)',60, false, '#c084fc'),
  ('expertise',          'Экспертиза',                     70, false, '#f472b6'),
  ('corrections',        'Устранение замечаний',           80, false, '#fb923c'),
  ('handover',           'Сдача заказчику',                90, false, '#facc15'),
  ('author_supervision', 'Авторский надзор',               100, false, '#34d399'),
  ('closed',             'Завершён / архив',               110, true,  '#22c55e');

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  code text unique,                       -- внутренний номер объекта, напр. "2026-014"
  name text not null,                     -- название объекта
  address text,                           -- адрес строительства
  client_id uuid references public.clients(id) on delete set null,
  gip_id uuid references public.employees(id) on delete set null,  -- ответственный ГИП
  department_id uuid references public.departments(id) on delete set null,
  stage_id uuid not null references public.stages(id),
  planned_start date,
  planned_finish date,
  budget numeric(14,2),                   -- сумма договора, если известна
  description text,
  is_archived boolean not null default false,
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.objects is 'Объекты проектирования — ядро CRM.';

create trigger trg_objects_updated_at
  before update on public.objects
  for each row execute procedure public.set_updated_at();

-- Команда объекта: какие сотрудники участвуют (для видимости по правам)
create table public.object_members (
  object_id uuid not null references public.objects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  role_on_object text, -- напр. 'конструктор', 'архитектор', 'инженер ОВиК'
  added_at timestamptz not null default now(),
  primary key (object_id, employee_id)
);

-- История смены стадий (аудит-лог)
create table public.object_stage_history (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects(id) on delete cascade,
  from_stage_id uuid references public.stages(id),
  to_stage_id uuid not null references public.stages(id),
  changed_by uuid references public.employees(id),
  comment text,
  changed_at timestamptz not null default now()
);

-- Триггер: при изменении stage_id объекта — автоматически пишем в историю
create or replace function public.log_object_stage_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE' and new.stage_id is distinct from old.stage_id) then
    insert into public.object_stage_history (object_id, from_stage_id, to_stage_id, changed_by)
    values (new.id, old.stage_id, new.stage_id, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_log_stage_change
  after update on public.objects
  for each row execute procedure public.log_object_stage_change();

-- -------------------------------------------------------------------------
-- 5. ЖУРНАЛ ПИСЕМ
-- -------------------------------------------------------------------------

create type public.letter_direction as enum ('incoming', 'outgoing');

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  direction public.letter_direction not null,
  registry_number text not null,          -- регистрационный номер в журнале
  letter_date date not null default current_date,
  object_id uuid references public.objects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  counterparty text,                      -- если не привязан к клиенту напрямую
  subject text not null,
  summary text,
  responsible_id uuid references public.employees(id),
  file_url text,                          -- ссылка на скан письма (Supabase Storage)
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now()
);

create unique index uq_letters_direction_number on public.letters(direction, registry_number);

comment on table public.letters is 'Журнал входящей и исходящей корреспонденции.';

-- -------------------------------------------------------------------------
-- 6. ДОГОВОРЫ
-- -------------------------------------------------------------------------

create type public.contract_status as enum ('draft','active','completed','terminated');

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  contract_date date not null default current_date,
  object_id uuid references public.objects(id) on delete set null,
  client_id uuid not null references public.clients(id),
  amount numeric(14,2),
  status public.contract_status not null default 'draft',
  start_date date,
  end_date date,
  file_url text,
  notes text,
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute procedure public.set_updated_at();

-- -------------------------------------------------------------------------
-- 7. ПРИКАЗЫ (внутренние распорядительные документы)
-- -------------------------------------------------------------------------

create type public.order_type as enum ('personnel','general','project','other');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  order_date date not null default current_date,
  order_type public.order_type not null default 'general',
  title text not null,
  body text,
  object_id uuid references public.objects(id) on delete set null,
  file_url text,
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now()
);

comment on table public.orders is 'Журнал приказов по организации (кадровые, общие, по объектам).';

-- -------------------------------------------------------------------------
-- 8. КОММЕРЧЕСКИЕ ПРЕДЛОЖЕНИЯ
-- -------------------------------------------------------------------------

create type public.proposal_status as enum ('draft','sent','accepted','rejected','expired');

create table public.commercial_proposals (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  proposal_date date not null default current_date,
  client_id uuid references public.clients(id) on delete set null,
  object_id uuid references public.objects(id) on delete set null,
  title text not null,
  total_amount numeric(14,2),
  status public.proposal_status not null default 'draft',
  valid_until date,
  file_url text,                    -- сгенерированный PDF
  created_by uuid references public.employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_proposals_updated_at
  before update on public.commercial_proposals
  for each row execute procedure public.set_updated_at();

-- Позиции (строки) КП — состав работ/разделов с ценой
create table public.commercial_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.commercial_proposals(id) on delete cascade,
  sort_order int not null default 0,
  description text not null,        -- напр. "Раздел АР", "Раздел КР"
  unit text default 'усл.',
  quantity numeric(10,2) default 1,
  unit_price numeric(14,2) not null default 0,
  amount numeric(14,2) generated always as (quantity * unit_price) stored
);

-- -------------------------------------------------------------------------
-- 9. ТАБЕЛЬ УЧЁТА РАБОЧЕГО ВРЕМЕНИ
-- -------------------------------------------------------------------------

create type public.timesheet_status as enum ('draft','submitted','approved','rejected');

-- Один табель = один сотрудник на один месяц
create table public.timesheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  status public.timesheet_status not null default 'draft',
  submitted_at timestamptz,
  approved_by uuid references public.employees(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (employee_id, period_year, period_month)
);

-- Записи по дням/объектам внутри табеля
create table public.timesheet_entries (
  id uuid primary key default gen_random_uuid(),
  timesheet_id uuid not null references public.timesheets(id) on delete cascade,
  work_date date not null,
  object_id uuid references public.objects(id) on delete set null,
  hours numeric(4,2) not null default 8 check (hours >= 0 and hours <= 24),
  entry_type text not null default 'work', -- work, sick, vacation, absence, holiday
  comment text,
  unique (timesheet_id, work_date, object_id)
);

comment on table public.timesheets is 'Табель учёта рабочего времени, помесячно на сотрудника.';
comment on table public.timesheet_entries is 'Детализация табеля по дням и объектам.';

-- =========================================================================
-- Индексы для производительности
-- =========================================================================
create index idx_objects_stage on public.objects(stage_id);
create index idx_objects_gip on public.objects(gip_id);
create index idx_objects_client on public.objects(client_id);
create index idx_letters_object on public.letters(object_id);
create index idx_contracts_object on public.contracts(object_id);
create index idx_orders_object on public.orders(object_id);
create index idx_proposals_client on public.commercial_proposals(client_id);
create index idx_timesheet_entries_date on public.timesheet_entries(work_date);
create index idx_object_members_employee on public.object_members(employee_id);
