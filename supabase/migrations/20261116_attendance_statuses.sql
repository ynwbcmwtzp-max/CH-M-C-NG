-- Apply to the existing project before deploying the new application.
-- Retains every attendance row, hours, note, audit entry and existing policy.
begin;
set local lock_timeout = '5s';
alter table public.attendance drop constraint attendance_status_check;
alter table public.attendance add constraint attendance_status_check
  check (status in ('TTKS','XLVPHC','CT','H','P','TS','N','NB','BENH','TH','NL','LV','TB','K'));
commit;
