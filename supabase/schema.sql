-- Run in Supabase SQL editor on an EMPTY project.
create extension if not exists pgcrypto;
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,role text not null default 'viewer' check(role in ('admin','editor','viewer')));
create table public.personnel(id uuid primary key default gen_random_uuid(),full_name text not null,position text not null default '',active boolean not null default true,created_at timestamptz not null default now());
create table public.attendance(id uuid primary key default gen_random_uuid(),person_id uuid not null references public.personnel(id),work_date date not null,status text not null check(status in ('TTKS','XLVPHC','CT','H','P','TS','N','NB','BENH','TH','NL','LV','TB','K')),hours numeric(4,1) not null default 0 check(hours between 0 and 24),note text not null default '',updated_by uuid references auth.users(id),updated_at timestamptz not null default now(),unique(person_id,work_date));
create table public.attendance_audit(id bigint generated always as identity primary key,attendance_id uuid,person_id uuid,work_date date,old_data jsonb,new_data jsonb,changed_by uuid,changed_at timestamptz not null default now());
create function public.my_role() returns text language sql stable security definer set search_path=public as $$select role from public.profiles where id=(select auth.uid())$$;
create function public.profile_new_user() returns trigger language plpgsql security definer set search_path=public as $$begin insert into public.profiles(id,role) values(new.id,'viewer');return new;end$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.profile_new_user();
create function public.audit_attendance() returns trigger language plpgsql security definer set search_path=public as $$begin if tg_op='INSERT' then insert into public.attendance_audit(attendance_id,person_id,work_date,old_data,new_data,changed_by) values(new.id,new.person_id,new.work_date,null,to_jsonb(new),auth.uid());return new;elsif tg_op='UPDATE' then new.updated_at=now();insert into public.attendance_audit(attendance_id,person_id,work_date,old_data,new_data,changed_by) values(new.id,new.person_id,new.work_date,to_jsonb(old),to_jsonb(new),auth.uid());return new;else insert into public.attendance_audit(attendance_id,person_id,work_date,old_data,new_data,changed_by) values(old.id,old.person_id,old.work_date,to_jsonb(old),null,auth.uid());return old;end if;end$$;
create trigger audit_attendance_trigger before insert or update or delete on public.attendance for each row execute function public.audit_attendance();
alter table public.profiles enable row level security;
alter table public.personnel enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_audit enable row level security;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.my_role()='admin');
create policy profiles_admin_update on public.profiles for update to authenticated using(public.my_role()='admin') with check(public.my_role()='admin');
create policy personnel_read on public.personnel for select to authenticated using(true);
create policy personnel_admin_insert on public.personnel for insert to authenticated with check(public.my_role()='admin');
create policy personnel_admin_update on public.personnel for update to authenticated using(public.my_role()='admin') with check(public.my_role()='admin');
create policy attendance_read on public.attendance for select to authenticated using(true);
create policy attendance_write_insert on public.attendance for insert to authenticated with check(public.my_role() in ('admin','editor') and updated_by=auth.uid());
create policy attendance_write_update on public.attendance for update to authenticated using(public.my_role() in ('admin','editor')) with check(public.my_role() in ('admin','editor') and updated_by=auth.uid());
create policy audit_admin_read on public.attendance_audit for select to authenticated using(public.my_role()='admin');
-- After creating the FIRST user in Authentication > Users, run the following manually with their UUID:
-- update public.profiles set role='admin' where id='REPLACE-WITH-USER-UUID';
-- Add other users via Supabase Authentication; they default to viewer.
-- Promote trusted users via SQL: update public.profiles set role='editor' where id='USER-UUID';
-- Enable realtime publication for attendance if desired:
-- alter publication supabase_realtime add table public.attendance;
