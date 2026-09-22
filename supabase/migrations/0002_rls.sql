-- =========================================================================
-- OLZHAPROJECT CRM — Row Level Security (разграничение прав доступа)
-- =========================================================================
-- Логика ролей:
--   director        — видит и редактирует всё
--   gip             — видит/редактирует объекты, где он GIP или в команде;
--                      письма/договоры/приказы/КП, привязанные к этим объектам
--   engineer        — видит объекты, где он в команде (object_members), только чтение
--                      по умолчанию, редактирование — по стадии/статусу
--   accountant      — полный доступ к договорам, КП, табелю; объекты — только чтение
--   office_manager  — полный доступ к письмам и приказам; объекты — только чтение
--   hr              — полный доступ к сотрудникам и табелю
--   viewer          — только чтение везде, без редактирования
--
-- Все проверки идут через вспомогательные функции public.current_role() и
-- public.is_object_visible(object_id), чтобы не дублировать логику в каждой политике.
-- =========================================================================

alter table public.departments enable row level security;
alter table public.employees enable row level security;
alter table public.clients enable row level security;
alter table public.stages enable row level security;
alter table public.objects enable row level security;
alter table public.object_members enable row level security;
alter table public.object_stage_history enable row level security;
alter table public.letters enable row level security;
alter table public.contracts enable row level security;
alter table public.orders enable row level security;
alter table public.commercial_proposals enable row level security;
alter table public.commercial_proposal_items enable row level security;
alter table public.timesheets enable row level security;
alter table public.timesheet_entries enable row level security;

-- -------------------------------------------------------------------------
-- Вспомогательные функции
-- -------------------------------------------------------------------------

create or replace function public.current_role()
returns public.employee_role
language sql stable security definer set search_path = public as $$
  select role from public.employees where id = auth.uid();
$$;

create or replace function public.is_active_employee()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_active from public.employees where id = auth.uid()), false);
$$;

-- Директор/HR — управленческие роли с широким доступом к справочникам
create or replace function public.is_admin_role()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role() in ('director','hr');
$$;

-- Виден ли объект текущему пользователю
create or replace function public.is_object_visible(p_object_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    public.current_role() in ('director','accountant','office_manager','hr','viewer')
    or exists (
      select 1 from public.objects o
      where o.id = p_object_id and o.gip_id = auth.uid()
    )
    or exists (
      select 1 from public.object_members m
      where m.object_id = p_object_id and m.employee_id = auth.uid()
    );
$$;

-- Может ли пользователь редактировать объект (не только видеть)
create or replace function public.can_edit_object(p_object_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select
    public.current_role() = 'director'
    or exists (
      select 1 from public.objects o
      where o.id = p_object_id and o.gip_id = auth.uid()
    );
$$;

-- -------------------------------------------------------------------------
-- DEPARTMENTS — читают все активные сотрудники, пишет director/hr
-- -------------------------------------------------------------------------
create policy departments_select on public.departments for select
  using (public.is_active_employee());
create policy departments_write on public.departments for all
  using (public.is_admin_role()) with check (public.is_admin_role());

-- -------------------------------------------------------------------------
-- EMPLOYEES
-- -------------------------------------------------------------------------
-- Каждый видит всех коллег (нужно для выбора ответственных в письмах/задачах),
-- но редактировать профили может только HR/директор; сам себя сотрудник
-- может редактировать в ограниченных полях через отдельный API-эндпоинт.
create policy employees_select on public.employees for select
  using (public.is_active_employee());

create policy employees_write on public.employees for all
  using (public.is_admin_role()) with check (public.is_admin_role());

create policy employees_self_update on public.employees for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- -------------------------------------------------------------------------
-- CLIENTS — видят все, кроме viewer с ограничением; пишут director/gip/accountant/office_manager
-- -------------------------------------------------------------------------
create policy clients_select on public.clients for select
  using (public.is_active_employee());

create policy clients_write on public.clients for all
  using (public.current_role() in ('director','gip','accountant','office_manager'))
  with check (public.current_role() in ('director','gip','accountant','office_manager'));

-- -------------------------------------------------------------------------
-- STAGES — читают все, пишет только director
-- -------------------------------------------------------------------------
create policy stages_select on public.stages for select
  using (public.is_active_employee());
create policy stages_write on public.stages for all
  using (public.current_role() = 'director')
  with check (public.current_role() = 'director');

-- -------------------------------------------------------------------------
-- OBJECTS
-- -------------------------------------------------------------------------
create policy objects_select on public.objects for select
  using (public.is_object_visible(id));

create policy objects_insert on public.objects for insert
  with check (public.current_role() in ('director','gip'));

create policy objects_update on public.objects for update
  using (public.can_edit_object(id))
  with check (public.can_edit_object(id));

create policy objects_delete on public.objects for delete
  using (public.current_role() = 'director');

-- -------------------------------------------------------------------------
-- OBJECT_MEMBERS — видно тем, кто видит объект; редактирует director/gip объекта
-- -------------------------------------------------------------------------
create policy object_members_select on public.object_members for select
  using (public.is_object_visible(object_id));

create policy object_members_write on public.object_members for all
  using (public.can_edit_object(object_id))
  with check (public.can_edit_object(object_id));

-- -------------------------------------------------------------------------
-- OBJECT_STAGE_HISTORY — только чтение для тех, кто видит объект; пишется триггером
-- -------------------------------------------------------------------------
create policy stage_history_select on public.object_stage_history for select
  using (public.is_object_visible(object_id));

create policy stage_history_insert on public.object_stage_history for insert
  with check (public.is_object_visible(object_id));

-- -------------------------------------------------------------------------
-- LETTERS — office_manager/director полный доступ; остальные видят письма
-- своих объектов
-- -------------------------------------------------------------------------
create policy letters_select on public.letters for select
  using (
    public.current_role() in ('director','office_manager')
    or (object_id is not null and public.is_object_visible(object_id))
  );

create policy letters_write on public.letters for all
  using (public.current_role() in ('director','office_manager'))
  with check (public.current_role() in ('director','office_manager'));

-- -------------------------------------------------------------------------
-- CONTRACTS — accountant/director полный доступ; gip видит договоры своих объектов
-- -------------------------------------------------------------------------
create policy contracts_select on public.contracts for select
  using (
    public.current_role() in ('director','accountant')
    or (object_id is not null and public.is_object_visible(object_id))
  );

create policy contracts_write on public.contracts for all
  using (public.current_role() in ('director','accountant'))
  with check (public.current_role() in ('director','accountant'));

-- -------------------------------------------------------------------------
-- ORDERS (приказы) — office_manager/director полный доступ
-- -------------------------------------------------------------------------
create policy orders_select on public.orders for select
  using (
    public.current_role() in ('director','office_manager','hr')
    or (object_id is not null and public.is_object_visible(object_id))
  );

create policy orders_write on public.orders for all
  using (public.current_role() in ('director','office_manager','hr'))
  with check (public.current_role() in ('director','office_manager','hr'));

-- -------------------------------------------------------------------------
-- COMMERCIAL PROPOSALS — accountant/director/gip
-- -------------------------------------------------------------------------
create policy proposals_select on public.commercial_proposals for select
  using (
    public.current_role() in ('director','accountant')
    or (object_id is not null and public.is_object_visible(object_id))
    or created_by = auth.uid()
  );

create policy proposals_write on public.commercial_proposals for all
  using (public.current_role() in ('director','accountant','gip'))
  with check (public.current_role() in ('director','accountant','gip'));

create policy proposal_items_select on public.commercial_proposal_items for select
  using (
    exists (
      select 1 from public.commercial_proposals p
      where p.id = proposal_id
    )
  );

create policy proposal_items_write on public.commercial_proposal_items for all
  using (public.current_role() in ('director','accountant','gip'))
  with check (public.current_role() in ('director','accountant','gip'));

-- -------------------------------------------------------------------------
-- TIMESHEETS — сотрудник видит/редактирует свой табель (пока draft);
-- HR/director видят и утверждают все табели
-- -------------------------------------------------------------------------
create policy timesheets_select on public.timesheets for select
  using (
    employee_id = auth.uid()
    or public.current_role() in ('director','hr')
  );

create policy timesheets_insert on public.timesheets for insert
  with check (employee_id = auth.uid() or public.current_role() in ('director','hr'));

create policy timesheets_update_own_draft on public.timesheets for update
  using (
    (employee_id = auth.uid() and status in ('draft','rejected'))
    or public.current_role() in ('director','hr')
  )
  with check (
    (employee_id = auth.uid() and status in ('draft','submitted'))
    or public.current_role() in ('director','hr')
  );

create policy timesheet_entries_select on public.timesheet_entries for select
  using (
    exists (
      select 1 from public.timesheets t
      where t.id = timesheet_id
        and (t.employee_id = auth.uid() or public.current_role() in ('director','hr'))
    )
  );

create policy timesheet_entries_write on public.timesheet_entries for all
  using (
    exists (
      select 1 from public.timesheets t
      where t.id = timesheet_id
        and (
          (t.employee_id = auth.uid() and t.status in ('draft','rejected'))
          or public.current_role() in ('director','hr')
        )
    )
  )
  with check (
    exists (
      select 1 from public.timesheets t
      where t.id = timesheet_id
        and (
          (t.employee_id = auth.uid() and t.status in ('draft','rejected'))
          or public.current_role() in ('director','hr')
        )
    )
  );
