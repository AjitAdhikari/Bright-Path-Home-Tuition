-- ╔══════════════════════════════════════════════════════════════════╗
-- ║ Setu / Bright Path — complete database setup (single clean file).   ║
-- ║                                                                     ║
-- ║ Sections:                                                           ║
-- ║   1. Extensions            6. Storage buckets + policies            ║
-- ║   2. Enums                 7. Matching functions (parent → tutors)  ║
-- ║   3. Tables + indexes      8. Safe public views                     ║
-- ║   4. Functions + triggers  9. Seed (admin + demo tutors + parent)   ║
-- ║   5. Row-level security                                             ║
-- ║                                                                     ║
-- ║ Apply with:  supabase db reset   (replays this file, then seeds).   ║
-- ║ Logins seeded (email / password):                                   ║
-- ║   admin@gmail.com  / admin123     → admin dashboard                 ║
-- ║   anita@gmail.com  / tutor123     → tutor dashboard (+4 more tutors) ║
-- ║   parent@gmail.com / parent123    → parent dashboard                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ╔═ 0. Reset (makes this script safe to paste/run repeatedly) ═══════╗
-- Wipe the public schema and the objects this file owns, then rebuild.
-- Everything in `public` (types, tables, functions, views, policies) is
-- dropped in one go, so re-running never hits "already exists".
drop schema if exists public cascade;
create schema public;
grant usage, create on schema public to postgres;
grant usage on schema public to anon, authenticated, service_role;

-- Storage policies live in the `storage` schema (not covered above) — drop
-- ours if an earlier run created them, so section 6 can recreate cleanly.
drop policy if exists "tutor uploads own docs" on storage.objects;
drop policy if exists "tutor reads own docs"   on storage.objects;
drop policy if exists "admin reads all docs"   on storage.objects;
drop policy if exists "avatars public read"    on storage.objects;
drop policy if exists "avatars owner write"    on storage.objects;

-- Remove any users seeded by an earlier run (identities cascade in `auth`;
-- profiles were already dropped with the public schema above).
delete from auth.users where email in (
  'admin@gmail.com', 'parent@gmail.com', 'anita@gmail.com',
  'rajesh@gmail.com', 'sita@gmail.com', 'bikash@gmail.com', 'pooja@gmail.com'
);

-- ╔═ 1. Extensions ═══════════════════════════════════════════════════╗
create extension if not exists pgcrypto;

-- Human-friendly application numbers: BP-<year>-00001. Defined early because
-- tutor_applications.application_number uses it as a column default.
create sequence if not exists application_number_seq start 1;
create or replace function gen_application_number() returns text
language sql volatile as $$
  select 'BP-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('application_number_seq')::text, 5, '0');
$$;

-- ╔═ 2. Enums ════════════════════════════════════════════════════════╗
create type user_role           as enum ('parent', 'tutor', 'admin');
create type verification_status as enum ('pending', 'needs_info', 'approved', 'rejected');
-- Tutor-application lifecycle (distinct from tutor_profiles.verification_status,
-- which the matching engine reads). The application trigger keeps the two in sync.
create type application_status as enum (
  'pending_review', 'under_review', 'changes_requested', 'approved', 'rejected'
);
create type doc_type            as enum (
  'citizenship', 'certificate', 'police_report', 'experience_letter',
  'cv', 'academic_certificate', 'training_certificate', 'photo', 'other'
);
create type review_status       as enum ('pending', 'approved', 'rejected');
create type time_slot           as enum ('morning', 'day', 'evening');
create type tuition_mode        as enum ('home', 'online');
create type gender_pref         as enum ('any', 'male', 'female');
create type case_status as enum (
  'new', 'verified', 'tutors_shared', 'demo_scheduled',
  'demo_done', 'confirmed', 'active', 'replacement', 'closed'
);
create type match_status as enum (
  'shared', 'accepted', 'declined', 'demo_scheduled',
  'demo_done', 'chosen', 'not_chosen'
);
create type tuition_status    as enum ('active', 'ended');
create type payment_direction as enum ('in', 'payout');
create type payment_method    as enum ('esewa', 'khalti', 'fonepay', 'bank', 'cash');
create type payment_status    as enum ('pending', 'paid', 'failed', 'refunded');
create type attendance_status as enum ('held', 'missed', 'cancelled');

-- ╔═ 3. Tables ═══════════════════════════════════════════════════════╗

-- Core identity
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'parent',
  full_name   text not null,
  phone       text,
  email       text,
  created_at  timestamptz not null default now()
);

create table tutor_profiles (
  user_id             uuid primary key references profiles(id) on delete cascade,
  bio                 text,
  education           text,
  experience_years    int default 0,
  gender              text,
  photo_path          text,
  teaches_online      boolean default false,
  verification_status verification_status not null default 'pending',
  verified_by         uuid references profiles(id),
  verified_at         timestamptz,
  rating_avg          numeric(2,1) default 0,
  created_at          timestamptz not null default now(),
  -- Extended application fields (all nullable; filled by the multi-step form).
  date_of_birth           date,
  whatsapp                text,
  permanent_address       text,
  current_address         text,
  city                    text,
  district                text,
  preferred_location      text,
  max_travel_km           int,
  available_days          text,   -- comma-separated
  available_slots         text,   -- comma-separated
  preferred_student_level text,
  expected_fee            numeric,
  languages               text,
  why_join                text,
  strengths               text,
  teaching_approach       text,
  additional_info         text,
  intro_video_url         text
);

create table tutor_documents (
  id            uuid primary key default gen_random_uuid(),
  tutor_id      uuid not null references profiles(id) on delete cascade,
  doc_type      doc_type not null,
  storage_path  text not null,
  file_name     text,            -- original filename, for admin display
  mime_type     text,            -- validated MIME, for preview/download
  size_bytes    bigint,
  review_status review_status not null default 'pending',
  created_at    timestamptz not null default now()
);

-- Multiple educational qualifications per tutor (Step 2 of the application).
create table tutor_qualifications (
  id              uuid primary key default gen_random_uuid(),
  tutor_id        uuid not null references profiles(id) on delete cascade,
  level           text,          -- degree / level
  faculty         text,          -- faculty / stream
  major           text,
  institution     text,          -- college / university
  graduation_year int,
  gpa             text,          -- GPA or percentage
  additional      text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- Multiple teaching-experience records per tutor (Step 3 of the application).
create table tutor_experiences (
  id           uuid primary key default gen_random_uuid(),
  tutor_id     uuid not null references profiles(id) on delete cascade,
  institution  text,
  role         text,
  classes      text,
  subjects     text,
  description  text,
  achievements text,
  methodology  text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- One application per tutor; its status drives dashboard access + admin review.
create table tutor_applications (
  id                 uuid primary key default gen_random_uuid(),
  tutor_id           uuid not null unique references profiles(id) on delete cascade,
  application_number text not null unique default gen_application_number(),
  status             application_status not null default 'pending_review',
  submitted_at       timestamptz not null default now(),
  reviewed_by        uuid references profiles(id),
  reviewed_at        timestamptz,
  rejection_reason   text,
  admin_feedback     text,        -- shown to tutor on "changes requested"
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Append-only status trail (who changed it, when, and why).
create table application_status_history (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references tutor_applications(id) on delete cascade,
  status         application_status not null,
  note           text,
  changed_by     uuid references profiles(id),
  created_at     timestamptz not null default now()
);

-- Private admin-only notes on an application (never visible to tutors).
create table admin_application_notes (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references tutor_applications(id) on delete cascade,
  author_id      uuid references profiles(id),
  body           text not null,
  created_at     timestamptz not null default now()
);

-- Versioned contract/agreement content, editable by admins.
create table tutor_agreements (
  id             uuid primary key default gen_random_uuid(),
  version        int  not null unique,
  terms_version  text not null,
  privacy_version text not null,
  title          text not null,
  body           text not null,
  is_active      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Immutable record of what the tutor accepted, at submission time.
create table agreement_acceptances (
  id                       uuid primary key default gen_random_uuid(),
  application_id           uuid not null references tutor_applications(id) on delete cascade,
  tutor_id                 uuid references profiles(id) on delete cascade,
  full_name                text,
  agreement_version        int,
  terms_version            text,
  privacy_version          text,
  accepted_rules           boolean not null default false,
  accepted_accuracy        boolean not null default false,
  accepted_privacy         boolean not null default false,
  accepted_not_guaranteed  boolean not null default false,
  accepted_at              timestamptz not null default now(),
  submission_at            timestamptz
);

-- Public tutor applications submitted BEFORE any login account exists. A
-- visitor fills the become-tutor form (profile + documents) with no sign-in;
-- the Supabase auth user is provisioned only when an admin approves
-- (provisioned_user_id links to the created profile). This is why tutor_id is
-- absent here — there is no auth user yet.
create table tutor_applicants (
  id                  uuid primary key default gen_random_uuid(),
  application_number  text not null unique default gen_application_number(),
  status              application_status not null default 'pending_review',
  full_name           text not null,
  email               text not null,
  phone               text,
  education           text,
  experience_years    int,
  gender              text,
  bio                 text,
  areas               text,   -- areas the tutor can travel to (free text)
  levels              text,   -- comma-separated levels they teach
  -- review + provisioning
  reviewed_by         uuid references profiles(id),
  reviewed_at         timestamptz,
  rejection_reason    text,
  admin_feedback      text,
  provisioned_user_id uuid references profiles(id),
  submitted_at        timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Documents attached to a pre-account application. Stored in the private
-- tutor-documents bucket under applicants/<applicant_id>/… via the service
-- role (the visitor has no session), and moved to the tutor's own folder on
-- approval.
create table applicant_documents (
  id           uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references tutor_applicants(id) on delete cascade,
  doc_type     doc_type not null,
  storage_path text not null,
  file_name    text,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

-- Outbound email log (Resend). Lets admins audit what was sent.
create table email_notifications (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid references tutor_applications(id) on delete set null,
  to_email       text not null,
  template       text not null,
  subject        text,
  status         text not null default 'queued',  -- queued | sent | failed | skipped
  provider_id    text,
  error          text,
  created_at     timestamptz not null default now(),
  sent_at        timestamptz
);

-- Lookups
create table subjects (id serial primary key, name text unique not null, sort_order int default 0);
create table levels   (id serial primary key, name text unique not null, sort_order int default 0);
create table areas    (id serial primary key, name text not null, municipality text, ward text);

create table tutor_subjects (
  id          uuid primary key default gen_random_uuid(),
  tutor_id    uuid not null references profiles(id) on delete cascade,
  subject_id  int not null references subjects(id),
  level_id    int not null references levels(id),
  monthly_fee numeric not null
);

create table tutor_areas (
  tutor_id uuid not null references profiles(id) on delete cascade,
  area_id  int not null references areas(id),
  primary key (tutor_id, area_id)
);

create table tutor_availability (
  id          uuid primary key default gen_random_uuid(),
  tutor_id    uuid not null references profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  slot        time_slot not null
);

-- The case
create table requests (
  id             uuid primary key default gen_random_uuid(),
  parent_id      uuid references profiles(id) on delete set null, -- nullable: guest form
  contact_name   text not null,
  phone          text not null,                                   -- private
  child_grade    text not null,
  board          text,
  area_id        int references areas(id),
  full_address   text,                                            -- private
  mode           tuition_mode not null default 'home',
  budget         numeric,
  gender_pref    gender_pref default 'any',
  status         case_status not null default 'new',
  assigned_admin uuid references profiles(id),
  created_at     timestamptz not null default now()
);

create table request_subjects (
  request_id uuid not null references requests(id) on delete cascade,
  subject_id int not null references subjects(id),
  primary key (request_id, subject_id)
);

create table matches (
  id           uuid primary key default gen_random_uuid(),
  request_id   uuid not null references requests(id) on delete cascade,
  tutor_id     uuid not null references profiles(id) on delete cascade,
  status       match_status not null default 'shared',
  demo_date    date,
  proposed_fee numeric,
  created_at   timestamptz not null default now()
);

create table tuitions (
  id              uuid primary key default gen_random_uuid(),
  match_id        uuid not null references matches(id) on delete cascade,
  start_date      date,
  monthly_fee     numeric not null,
  commission_rate numeric not null default 0.5,
  status          tuition_status not null default 'active',
  end_reason      text,
  created_at      timestamptz not null default now()
);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  tuition_id  uuid references tuitions(id) on delete set null,
  direction   payment_direction not null,
  amount      numeric not null,
  method      payment_method not null,
  gateway_ref text unique,
  status      payment_status not null default 'pending',
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table attendance (
  id         uuid primary key default gen_random_uuid(),
  tuition_id uuid not null references tuitions(id) on delete cascade,
  class_date date not null,
  status     attendance_status not null default 'held'
);

create table reviews (
  id         uuid primary key default gen_random_uuid(),
  tuition_id uuid not null references tuitions(id) on delete cascade,
  tutor_id   uuid not null references profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  is_public  boolean default true,
  created_at timestamptz not null default now()
);

create table case_notes (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  admin_id   uuid references profiles(id),
  note       text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  phone      text,
  channel    text not null,       -- sms | whatsapp | email
  template   text not null,
  status     text not null default 'queued',
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_requests_status        on requests(status);
create index idx_matches_request        on matches(request_id);
create index idx_matches_tutor          on matches(tutor_id);
create index idx_payments_tuition       on payments(tuition_id);
create index idx_tutor_profiles_status  on tutor_profiles(verification_status);
create index idx_tutor_subjects_tutor   on tutor_subjects(tutor_id);
create index idx_tutor_areas_area       on tutor_areas(area_id);
create index idx_applications_status    on tutor_applications(status);
create index idx_applications_tutor     on tutor_applications(tutor_id);
create index idx_ash_application        on application_status_history(application_id);
create index idx_docs_tutor             on tutor_documents(tutor_id);

-- ╔═ 4. Functions + triggers ═════════════════════════════════════════╗

-- Role lookup straight from `profiles` (SECURITY DEFINER avoids RLS
-- recursion). No GoTrue custom-token hook needed — a logged-in admin is
-- recognised purely from their profile row, so the admin dashboard works.
create or replace function auth_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role::text from profiles where id = auth.uid()), 'anon');
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- Keep tutor_profiles.rating_avg in sync when a review lands.
create or replace function sync_tutor_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update tutor_profiles tp
     set rating_avg = (
       select round(avg(rating)::numeric, 1) from reviews r where r.tutor_id = new.tutor_id
     )
   where tp.user_id = new.tutor_id;
  return new;
end; $$;
create trigger trg_sync_rating
after insert or update on reviews
for each row execute function sync_tutor_rating();

-- Auto-create a profile row when an auth user signs up.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'parent'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do nothing;

  -- A tutor's application is created up front (status 'pending_review') so
  -- dashboard access stays gated until an admin approves it.
  if coalesce((new.raw_user_meta_data->>'role'), 'parent') = 'tutor' then
    insert into public.tutor_applications (tutor_id)
    values (new.id)
    on conflict (tutor_id) do nothing;
  end if;
  return new;
end; $$;
create trigger trg_new_user
after insert on auth.users
for each row execute function handle_new_user();

-- BEFORE UPDATE: a tutor may not move their own application into an admin-only
-- state. They may only resubmit (changes_requested -> pending_review).
-- Also stamps updated_at. Runs before the AFTER trigger below, so history and
-- verification sync always see the *final* (possibly reverted) status.
create or replace function guard_application_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin()
     and new.status is distinct from old.status
     and not (old.status = 'changes_requested' and new.status = 'pending_review') then
    new.status := old.status;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.rejection_reason := old.rejection_reason;
    new.admin_feedback := old.admin_feedback;
  end if;
  new.updated_at := now();
  return new;
end; $$;
create trigger trg_guard_application before update on tutor_applications
for each row execute function guard_application_status();

-- AFTER INSERT/UPDATE: append the status trail and mirror the matching engine's
-- tutor_profiles.verification_status. SECURITY DEFINER so it can update
-- tutor_profiles past the guard_verification trigger.
create or replace function on_application_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into application_status_history (application_id, status, changed_by)
    values (new.id, new.status, auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into application_status_history (application_id, status, note, changed_by)
    values (new.id, new.status,
            coalesce(new.admin_feedback, new.rejection_reason), auth.uid());

    -- Mirror onto tutor_profiles so match_tutors / public_tutors stay correct.
    if new.status = 'approved' then
      update tutor_profiles
         set verification_status = 'approved',
             verified_by = new.reviewed_by,
             verified_at = coalesce(new.reviewed_at, now())
       where user_id = new.tutor_id;
    elsif new.status = 'rejected' then
      update tutor_profiles set verification_status = 'rejected'
       where user_id = new.tutor_id;
    elsif new.status = 'changes_requested' then
      update tutor_profiles set verification_status = 'needs_info'
       where user_id = new.tutor_id;
    else
      update tutor_profiles set verification_status = 'pending'
       where user_id = new.tutor_id;
    end if;
  end if;
  return new;
end; $$;
create trigger trg_application_insert after insert on tutor_applications
for each row execute function on_application_change();
create trigger trg_application_update after update on tutor_applications
for each row execute function on_application_change();

-- A tutor may not change their own verification fields — only an admin can.
create or replace function guard_verification() returns trigger
language plpgsql as $$
begin
  if not is_admin() and new.verification_status is distinct from old.verification_status then
    new.verification_status := old.verification_status;
    new.verified_by := old.verified_by;
    new.verified_at := old.verified_at;
  end if;
  return new;
end; $$;
create trigger trg_guard_verification before update on tutor_profiles
for each row execute function guard_verification();

-- ╔═ 5. Row-level security ═══════════════════════════════════════════╗
alter table profiles            enable row level security;
alter table tutor_profiles      enable row level security;
alter table tutor_documents     enable row level security;
alter table subjects            enable row level security;
alter table levels              enable row level security;
alter table areas               enable row level security;
alter table tutor_subjects      enable row level security;
alter table tutor_areas         enable row level security;
alter table tutor_availability  enable row level security;
alter table requests            enable row level security;
alter table request_subjects    enable row level security;
alter table matches             enable row level security;
alter table tuitions            enable row level security;
alter table payments            enable row level security;
alter table attendance          enable row level security;
alter table reviews             enable row level security;
alter table case_notes          enable row level security;
alter table notifications       enable row level security;
alter table tutor_qualifications    enable row level security;
alter table tutor_experiences       enable row level security;
alter table tutor_applications      enable row level security;
alter table application_status_history enable row level security;
alter table admin_application_notes enable row level security;
alter table tutor_agreements        enable row level security;
alter table agreement_acceptances   enable row level security;
alter table email_notifications     enable row level security;
alter table tutor_applicants        enable row level security;
alter table applicant_documents     enable row level security;

-- Lookups: readable by anyone, writable by admin.
create policy lookups_read_subjects  on subjects for select using (true);
create policy lookups_read_levels    on levels   for select using (true);
create policy lookups_read_areas     on areas    for select using (true);
create policy lookups_admin_subjects on subjects for all using (is_admin()) with check (is_admin());
create policy lookups_admin_levels   on levels   for all using (is_admin()) with check (is_admin());
create policy lookups_admin_areas    on areas    for all using (is_admin()) with check (is_admin());

-- profiles
create policy profiles_own on profiles
  for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin on profiles
  for all using (is_admin()) with check (is_admin());

-- tutor_profiles (owner edits; admin all; public reads approved)
create policy tutor_profiles_own on tutor_profiles
  for select using (user_id = auth.uid() or is_admin() or verification_status = 'approved');
create policy tutor_profiles_insert_own on tutor_profiles
  for insert with check (user_id = auth.uid());
create policy tutor_profiles_update_own on tutor_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tutor_profiles_admin on tutor_profiles
  for all using (is_admin()) with check (is_admin());

-- tutor_documents: owner + admin only, never public
create policy tutor_docs_own on tutor_documents
  for all using (tutor_id = auth.uid() or is_admin())
  with check (tutor_id = auth.uid() or is_admin());

-- Tutor qualifications / experiences: owner read-write, admin read-write.
create policy tq_rw on tutor_qualifications for all
  using (tutor_id = auth.uid() or is_admin())
  with check (tutor_id = auth.uid() or is_admin());
create policy te_rw on tutor_experiences for all
  using (tutor_id = auth.uid() or is_admin())
  with check (tutor_id = auth.uid() or is_admin());

-- Applications: owner reads/updates own; admin does everything. The
-- guard_application_status trigger stops a tutor self-approving even though the
-- update policy lets them write their own row.
create policy applications_select_own on tutor_applications
  for select using (tutor_id = auth.uid() or is_admin());
create policy applications_insert_own on tutor_applications
  for insert with check (tutor_id = auth.uid() or is_admin());
create policy applications_update_own on tutor_applications
  for update using (tutor_id = auth.uid() or is_admin())
  with check (tutor_id = auth.uid() or is_admin());
create policy applications_admin on tutor_applications
  for all using (is_admin()) with check (is_admin());

-- Status history: readable by the owning tutor or an admin; writes happen only
-- through the SECURITY DEFINER trigger, so no direct insert policy is granted.
create policy ash_select on application_status_history
  for select using (
    is_admin() or exists (
      select 1 from tutor_applications a
       where a.id = application_id and a.tutor_id = auth.uid()
    )
  );
create policy ash_admin on application_status_history
  for all using (is_admin()) with check (is_admin());

-- Admin internal notes: admin only, never visible to tutors.
create policy notes_admin on admin_application_notes
  for all using (is_admin()) with check (is_admin());

-- Agreement content: anyone may read the active version(s); only admins edit.
create policy agreements_read on tutor_agreements for select using (true);
create policy agreements_admin on tutor_agreements
  for all using (is_admin()) with check (is_admin());

-- Acceptance records: a tutor inserts + reads their own; nobody but admins may
-- change them afterwards (immutable from the tutor's side — no update policy).
create policy acc_insert_own on agreement_acceptances
  for insert with check (tutor_id = auth.uid() or is_admin());
create policy acc_select_own on agreement_acceptances
  for select using (tutor_id = auth.uid() or is_admin());
create policy acc_admin on agreement_acceptances
  for all using (is_admin()) with check (is_admin());

-- Email log: admin only (the server writes with the service-role key).
create policy email_admin on email_notifications
  for all using (is_admin()) with check (is_admin());

-- Applicants + their documents: admin-only for all authenticated/anon access.
-- Public submission and approval-time provisioning both run with the
-- service-role key, which bypasses RLS, so no public policy is exposed.
create policy applicants_admin on tutor_applicants
  for all using (is_admin()) with check (is_admin());
create policy applicant_docs_admin on applicant_documents
  for all using (is_admin()) with check (is_admin());

-- tutor_subjects / areas / availability: owner + admin write, public read
create policy ts_rw on tutor_subjects for all
  using (tutor_id = auth.uid() or is_admin()) with check (tutor_id = auth.uid() or is_admin());
create policy ts_public on tutor_subjects for select using (true);
create policy ta_rw on tutor_areas for all
  using (tutor_id = auth.uid() or is_admin()) with check (tutor_id = auth.uid() or is_admin());
create policy ta_public on tutor_areas for select using (true);
create policy tav_rw on tutor_availability for all
  using (tutor_id = auth.uid() or is_admin()) with check (tutor_id = auth.uid() or is_admin());
create policy tav_public on tutor_availability for select using (true);

-- requests: public can insert the guest form; parents read own; admin all.
create policy requests_insert_public on requests for insert with check (true);
create policy requests_select_own on requests
  for select using (parent_id = auth.uid() or is_admin());
create policy requests_admin on requests
  for update using (is_admin()) with check (is_admin());

-- request_subjects
create policy rs_insert_public on request_subjects for insert with check (true);
create policy rs_select on request_subjects for select
  using (is_admin() or exists (
    select 1 from requests r where r.id = request_id and r.parent_id = auth.uid()
  ));

-- matches
create policy matches_admin on matches for all using (is_admin()) with check (is_admin());
create policy matches_tutor_read on matches for select using (tutor_id = auth.uid());
create policy matches_parent_read on matches for select
  using (exists (select 1 from requests r where r.id = request_id and r.parent_id = auth.uid()));

-- tuitions / attendance
create policy tuitions_admin on tuitions for all using (is_admin()) with check (is_admin());
create policy tuitions_party_read on tuitions for select using (
  is_admin() or exists (
    select 1 from matches m join requests r on r.id = m.request_id
     where m.id = match_id and (m.tutor_id = auth.uid() or r.parent_id = auth.uid())
  )
);
create policy attendance_admin on attendance for all using (is_admin()) with check (is_admin());
create policy attendance_party_read on attendance for select using (
  is_admin() or exists (
    select 1 from tuitions t join matches m on m.id = t.match_id
       join requests r on r.id = m.request_id
     where t.id = tuition_id and (m.tutor_id = auth.uid() or r.parent_id = auth.uid())
  )
);

-- payments
create policy payments_admin on payments for all using (is_admin()) with check (is_admin());
create policy payments_party_read on payments for select using (
  is_admin() or exists (
    select 1 from tuitions t join matches m on m.id = t.match_id
       join requests r on r.id = m.request_id
     where t.id = tuition_id and (m.tutor_id = auth.uid() or r.parent_id = auth.uid())
  )
);

-- reviews
create policy reviews_public_read on reviews for select using (is_public or is_admin());
create policy reviews_parent_write on reviews for insert with check (
  exists (
    select 1 from tuitions t join matches m on m.id = t.match_id
       join requests r on r.id = m.request_id
     where t.id = tuition_id and r.parent_id = auth.uid()
  )
);
create policy reviews_admin on reviews for all using (is_admin()) with check (is_admin());

-- case_notes / notifications: admin only
create policy case_notes_admin on case_notes for all using (is_admin()) with check (is_admin());
create policy notifications_admin on notifications for all using (is_admin()) with check (is_admin());

-- ╔═ 6. Storage buckets + policies ═══════════════════════════════════╗
insert into storage.buckets (id, name, public) values ('tutor-documents', 'tutor-documents', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "tutor uploads own docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'tutor-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tutor reads own docs" on storage.objects for select to authenticated
  using (bucket_id = 'tutor-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admin reads all docs" on storage.objects for select to authenticated
  using (bucket_id = 'tutor-documents' and is_admin());
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ╔═ 7. Matching functions ═══════════════════════════════════════════╗

-- Ranked, contact-free tutor cards that fit a request. SECURITY DEFINER so a
-- guest (anon) gets a list without being able to read the raw tables.
create or replace function match_tutors(p_request uuid)
returns table (
  user_id uuid, full_name text, bio text, education text, experience_years int,
  gender text, photo_path text, teaches_online boolean, rating_avg numeric,
  matched_subjects bigint, from_fee numeric, subjects text[]
)
language sql stable security definer set search_path = public as $$
  with req as (select * from requests where id = p_request),
  lvl as (select l.id from levels l, req where l.name = req.child_grade)
  select
    tp.user_id, p.full_name, tp.bio, tp.education, tp.experience_years,
    tp.gender, tp.photo_path, tp.teaches_online, tp.rating_avg,
    count(distinct ts.subject_id)              as matched_subjects,
    min(ts.monthly_fee)                        as from_fee,
    array_agg(distinct s.name order by s.name) as subjects
  from req
  join tutor_profiles tp on tp.verification_status = 'approved'
  join profiles p on p.id = tp.user_id
  join tutor_subjects ts
    on ts.tutor_id = tp.user_id
   and ts.subject_id in (select subject_id from request_subjects where request_id = p_request)
   and (not exists (select 1 from lvl) or ts.level_id = (select id from lvl))
  join subjects s on s.id = ts.subject_id
  where (req.gender_pref = 'any' or lower(tp.gender) = req.gender_pref::text)
    and (req.budget is null or ts.monthly_fee <= req.budget)
    and (case
           when req.mode = 'online' then tp.teaches_online
           when req.area_id is null then true
           else exists (select 1 from tutor_areas ta where ta.tutor_id = tp.user_id and ta.area_id = req.area_id)
         end)
  group by tp.user_id, p.full_name, tp.bio, tp.education, tp.experience_years,
           tp.gender, tp.photo_path, tp.teaches_online, tp.rating_avg
  order by matched_subjects desc, tp.rating_avg desc nulls last, from_fee asc
  limit 20;
$$;
grant execute on function match_tutors(uuid) to anon, authenticated;

-- Admin shortlist matcher: broader than the parent-facing match_tutors. It
-- filters on the three criteria an admin cares about when hand-picking —
-- AREA, SUBJECT and CLASS/level — but does NOT drop a tutor over budget or
-- gender preference. Those are returned (from_fee, gender) so the admin can
-- weigh them while ticking, rather than silently excluding good candidates.
create or replace function match_tutors_admin(p_request uuid)
returns table (
  user_id uuid, full_name text, bio text, education text, experience_years int,
  gender text, photo_path text, teaches_online boolean, rating_avg numeric,
  matched_subjects bigint, from_fee numeric, subjects text[]
)
language sql stable security definer set search_path = public as $$
  with req as (select * from requests where id = p_request),
  lvl as (select l.id from levels l, req where l.name = req.child_grade)
  select
    tp.user_id, p.full_name, tp.bio, tp.education, tp.experience_years,
    tp.gender, tp.photo_path, tp.teaches_online, tp.rating_avg,
    count(distinct ts.subject_id)              as matched_subjects,
    min(ts.monthly_fee)                        as from_fee,
    array_agg(distinct s.name order by s.name) as subjects
  from req
  join tutor_profiles tp on tp.verification_status = 'approved'
  join profiles p on p.id = tp.user_id
  join tutor_subjects ts
    on ts.tutor_id = tp.user_id
   and ts.subject_id in (select subject_id from request_subjects where request_id = p_request)
   and (not exists (select 1 from lvl) or ts.level_id = (select id from lvl))
  join subjects s on s.id = ts.subject_id
  where (case
           when req.mode = 'online' then tp.teaches_online
           when req.area_id is null then true
           else exists (select 1 from tutor_areas ta where ta.tutor_id = tp.user_id and ta.area_id = req.area_id)
         end)
  group by tp.user_id, p.full_name, tp.bio, tp.education, tp.experience_years,
           tp.gender, tp.photo_path, tp.teaches_online, tp.rating_avg
  order by matched_subjects desc, tp.rating_avg desc nulls last, from_fee asc
  limit 50;
$$;
grant execute on function match_tutors_admin(uuid) to authenticated;

-- Save the request (+ subjects, note, area) and return the matches in one call.
create or replace function submit_tuition_request(
  p_contact_name text, p_phone text, p_child_grade text, p_board text,
  p_subjects text[], p_area text, p_full_address text, p_mode text,
  p_budget numeric, p_gender_pref text, p_notes text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_area_id int;
  v_request uuid;
  v_matches jsonb;
begin
  select a.id into v_area_id
    from areas a where p_area ilike '%' || a.name || '%'
   order by length(a.name) desc limit 1;

  insert into requests (
    parent_id, contact_name, phone, child_grade, board, area_id,
    full_address, mode, budget, gender_pref, status
  ) values (
    auth.uid(), p_contact_name, p_phone, p_child_grade, nullif(p_board, ''),
    v_area_id, nullif(p_full_address, ''), lower(p_mode)::tuition_mode,
    p_budget, lower(p_gender_pref)::gender_pref, 'new'
  ) returning id into v_request;

  insert into request_subjects (request_id, subject_id)
  select v_request, s.id from subjects s where s.name = any (p_subjects)
  on conflict do nothing;

  if coalesce(trim(p_notes), '') <> '' then
    insert into case_notes (request_id, note) values (v_request, p_notes);
  end if;

  select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) into v_matches
    from match_tutors(v_request) m;

  return jsonb_build_object('request_id', v_request, 'matches', v_matches);
end; $$;
grant execute on function submit_tuition_request(
  text, text, text, text, text[], text, text, text, numeric, text, text
) to anon, authenticated;

-- ╔═ 8. Safe public views ════════════════════════════════════════════╗
create view public_tutors as
select tp.user_id, p.full_name, tp.bio, tp.education, tp.experience_years,
       tp.gender, tp.photo_path, tp.teaches_online, tp.rating_avg
  from tutor_profiles tp join profiles p on p.id = tp.user_id
 where tp.verification_status = 'approved';

create view tutor_lead_view as
select r.id, r.child_grade, r.board, r.area_id, r.mode, r.budget,
       r.gender_pref, r.status, r.created_at
  from requests r;

-- ╔═ 9. Seed ═════════════════════════════════════════════════════════╗

-- Lookups
insert into subjects (name, sort_order) values
  ('Maths', 1), ('Science', 2), ('English', 3), ('Nepali', 4),
  ('Physics', 5), ('Chemistry', 6), ('Biology', 7), ('Accountancy', 8),
  ('Economics', 9), ('Computer', 10), ('Social Studies', 11)
on conflict (name) do nothing;

insert into levels (name, sort_order) values
  ('Class 1–5', 1), ('Class 6–8', 2), ('SEE (Class 9–10)', 3),
  ('+2 Science', 4), ('+2 Management', 5), ('Bachelor', 6),
  ('IELTS / Test prep', 7), ('Computer', 8), ('Music', 9)
on conflict (name) do nothing;

insert into areas (name, municipality, ward) values
  ('Baneshwor', 'Kathmandu', '10'),
  ('Koteshwor', 'Kathmandu', '32'),
  ('Kirtipur', 'Kirtipur', '1'),
  ('Patan', 'Lalitpur', '15'),
  ('Thimi', 'Madhyapur Thimi', '5'),
  ('Lakeside', 'Pokhara', '6');

-- Active tutor agreement (v1). Wording is a starting point — the business owner
-- must review and approve it before it is treated as legally binding. Admins can
-- publish a new version at any time; acceptance records pin the version accepted.
insert into tutor_agreements (version, terms_version, privacy_version, title, body, is_active)
values (
  1, 'v1', 'v1', 'Bright Path Home Tuition — Tutor Agreement',
$agreement$Welcome to Bright Path Home Tuition. By submitting your application you agree to the following responsibilities as a tutor on our platform:

1. Accuracy of Information — You will provide accurate and genuine personal, educational, and professional information.
2. Document Verification — All certificates, CVs, experience letters, and identity documents you upload are genuine.
3. Professional Conduct — You will behave respectfully and professionally with students and parents.
4. Punctuality — You will follow agreed schedules and communicate any unavoidable delays or absences in advance.
5. Student Safety — You will maintain appropriate professional boundaries and prioritise student safety at all times.
6. Privacy and Confidentiality — You will not misuse or disclose students' personal information, contact details, academic records, or other confidential information.
7. Communication — You will communicate professionally with students, parents, and Bright Path administration.
8. Fee and Payment Rules — You will follow the applicable fee, commission, and payment policies communicated by the platform.
9. Policy Compliance — You will follow the platform's policies and reasonable administrative instructions.
10. Application Integrity — You will not submit duplicate, misleading, or fraudulent applications.
11. Application Approval — Submitting an application does not guarantee approval or immediate access to the Teacher Dashboard.
12. Suspension or Termination — Violations of applicable policies may result in suspension or termination, subject to the platform's stated procedures.$agreement$,
  true
);

-- Helper: create a login the exact way Supabase Auth (GoTrue) expects.
-- The empty-string token columns matter — NULL there breaks login with
-- "Database error querying schema". Dropped again at the end of seeding.
create or replace function seed_user(p_email text, p_password text, p_role text,
  p_name text, p_phone text default null) returns uuid
language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new,
    email_change_token_current, reauthentication_token, phone_change, phone_change_token
  ) values (
    uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('role', p_role, 'full_name', p_name, 'phone', p_phone),
    now(), now(), '', '', '', '', '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true),
    'email', now(), now(), now()
  );
  -- Trigger also creates the profile; make sure role/phone are right.
  insert into public.profiles (id, role, full_name, phone, email)
  values (uid, p_role::user_role, p_name, p_phone, p_email)
  on conflict (id) do update
    set role = excluded.role, full_name = excluded.full_name,
        phone = excluded.phone, email = excluded.email;
  return uid;
end; $$;

do $$
declare
  anita   uuid;  rajesh uuid;  sita uuid;  bikash uuid;  pooja uuid;
  -- subject ids
  s_math int := (select id from subjects where name = 'Maths');
  s_sci  int := (select id from subjects where name = 'Science');
  s_eng  int := (select id from subjects where name = 'English');
  s_nep  int := (select id from subjects where name = 'Nepali');
  s_phy  int := (select id from subjects where name = 'Physics');
  s_chem int := (select id from subjects where name = 'Chemistry');
  s_acc  int := (select id from subjects where name = 'Accountancy');
  s_eco  int := (select id from subjects where name = 'Economics');
  s_comp int := (select id from subjects where name = 'Computer');
  s_soc  int := (select id from subjects where name = 'Social Studies');
  -- level ids
  l_15   int := (select id from levels where name = 'Class 1–5');
  l_68   int := (select id from levels where name = 'Class 6–8');
  l_see  int := (select id from levels where name = 'SEE (Class 9–10)');
  l_sci  int := (select id from levels where name = '+2 Science');
  l_mgmt int := (select id from levels where name = '+2 Management');
  l_bach int := (select id from levels where name = 'Bachelor');
  l_comp int := (select id from levels where name = 'Computer');
  -- area ids
  a_ban  int := (select id from areas where name = 'Baneshwor');
  a_kot  int := (select id from areas where name = 'Koteshwor');
  a_kir  int := (select id from areas where name = 'Kirtipur');
  a_pat  int := (select id from areas where name = 'Patan');
  a_thi  int := (select id from areas where name = 'Thimi');
  a_lak  int := (select id from areas where name = 'Lakeside');
begin
  -- Admin + demo parent
  perform seed_user('admin@gmail.com',  'admin123',  'admin',  'Admin');
  perform seed_user('parent@gmail.com', 'parent123', 'parent', 'Demo Parent', '9807777777');

  -- Demo tutors (all approved so they appear in matches)
  anita  := seed_user('anita@gmail.com',  'tutor123', 'tutor', 'Anita Sharma',  '9801111111');
  rajesh := seed_user('rajesh@gmail.com', 'tutor123', 'tutor', 'Rajesh Thapa',  '9802222222');
  sita   := seed_user('sita@gmail.com',   'tutor123', 'tutor', 'Sita Gurung',   '9803333333');
  bikash := seed_user('bikash@gmail.com', 'tutor123', 'tutor', 'Bikash KC',     '9804444444');
  pooja  := seed_user('pooja@gmail.com',  'tutor123', 'tutor', 'Pooja Rai',     '9805555555');

  insert into tutor_profiles (user_id, bio, education, experience_years, gender, teaches_online, verification_status, verified_at, rating_avg) values
    (anita,  'Patient Maths & Science tutor focused on SEE board exams.',      'M.Sc. Physics, TU',        6, 'female', true,  'approved', now(), 4.9),
    (rajesh, 'Engineering graduate; +2 Science Physics/Chemistry specialist.', 'B.E. Mechanical, IOE',     8, 'male',   false, 'approved', now(), 4.7),
    (sita,   'Primary & lower-secondary English and Nepali, gentle approach.', 'B.Ed. English, TU',        4, 'female', true,  'approved', now(), 4.8),
    (bikash, 'Accountancy & Economics for +2 Management and Bachelor level.',  'MBA Finance, KU',          7, 'male',   false, 'approved', now(), 4.6),
    (pooja,  'Computer and Maths tutor; coding basics for school students.',   'BSc.CSIT, TU',             3, 'female', true,  'approved', now(), 4.9);

  insert into tutor_subjects (tutor_id, subject_id, level_id, monthly_fee) values
    -- Anita: Maths/Science at Class 6–8 and SEE
    (anita, s_math, l_68, 7000), (anita, s_sci, l_68, 7000),
    (anita, s_math, l_see, 8000), (anita, s_sci, l_see, 8000),
    -- Rajesh: Physics/Chemistry/Maths at SEE and +2 Science
    (rajesh, s_phy, l_see, 9000), (rajesh, s_chem, l_see, 9000), (rajesh, s_math, l_see, 9000),
    (rajesh, s_phy, l_sci, 12000), (rajesh, s_chem, l_sci, 12000),
    -- Sita: English/Nepali/Social at Class 1–5 and 6–8
    (sita, s_eng, l_15, 6000), (sita, s_nep, l_15, 6000), (sita, s_soc, l_15, 6000),
    (sita, s_eng, l_68, 6500), (sita, s_nep, l_68, 6500),
    -- Bikash: Accountancy/Economics at +2 Management and Bachelor
    (bikash, s_acc, l_mgmt, 10000), (bikash, s_eco, l_mgmt, 10000),
    (bikash, s_acc, l_bach, 13000), (bikash, s_eco, l_bach, 13000),
    -- Pooja: Computer/Maths/Science at Class 6–8, SEE, Computer
    (pooja, s_comp, l_comp, 7500), (pooja, s_math, l_68, 7000),
    (pooja, s_sci, l_68, 7000), (pooja, s_math, l_see, 8000), (pooja, s_comp, l_68, 7500);

  insert into tutor_areas (tutor_id, area_id) values
    (anita, a_ban), (anita, a_kot),
    (rajesh, a_ban), (rajesh, a_pat),
    (sita, a_pat), (sita, a_lak),
    (bikash, a_kot), (bikash, a_thi),
    (pooja, a_kir), (pooja, a_ban);

  insert into tutor_availability (tutor_id, day_of_week, slot) values
    (anita, 1, 'evening'), (anita, 3, 'evening'), (anita, 6, 'morning'),
    (rajesh, 2, 'evening'), (rajesh, 4, 'evening'),
    (sita, 1, 'day'), (sita, 5, 'day'),
    (bikash, 0, 'morning'), (bikash, 3, 'evening'),
    (pooja, 2, 'evening'), (pooja, 6, 'day');

  -- trg_new_user already created a 'pending_review' application for each seeded
  -- tutor. Replace those with 'approved' rows so the demo tutors keep dashboard
  -- access (UPDATE would be reverted by guard_application_status since the seed
  -- runs without an admin auth.uid(); INSERT is not guarded).
  delete from tutor_applications
   where tutor_id in (anita, rajesh, sita, bikash, pooja);
  insert into tutor_applications (tutor_id, status, submitted_at, reviewed_at)
  values (anita,  'approved', now(), now()),
         (rajesh, 'approved', now(), now()),
         (sita,   'approved', now(), now()),
         (bikash, 'approved', now(), now()),
         (pooja,  'approved', now(), now());
end $$;

drop function seed_user(text, text, text, text, text);

-- ╔═ 10. Grants ══════════════════════════════════════════════════════╗
-- Recreating the public schema drops Supabase's default role grants, so
-- re-establish them. RLS still gates every row — these grants only let the
-- PostgREST roles reach the tables at all.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables     in schema public to anon, authenticated, service_role;
grant all on all sequences  in schema public to anon, authenticated, service_role;
grant all on all functions  in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
