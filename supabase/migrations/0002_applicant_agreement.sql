-- Agreement acceptance for PUBLIC tutor applications (tutor_applicants).
--
-- The become-tutor form is filled before any auth account exists, so it writes
-- to tutor_applicants (not tutor_applications). The existing agreement_acceptances
-- table is keyed to tutor_applications and cannot hold a pre-account acceptance,
-- so we record the acceptance directly on the applicant row. These columns form
-- an immutable snapshot of WHAT the applicant accepted and WHEN: the server sets
-- the authoritative timestamp, and the version string pins the exact agreement
-- text the applicant saw, so a future edit to the agreement never rewrites history.

alter table tutor_applicants
  add column if not exists agreement_accepted      boolean     not null default false,
  add column if not exists agreement_accepted_at   timestamptz,
  add column if not exists agreement_version        text,
  add column if not exists agreement_teacher_name   text;

comment on column tutor_applicants.agreement_accepted is
  'Whether the applicant explicitly accepted the Teacher Application Agreement. Must be true to submit.';
comment on column tutor_applicants.agreement_version is
  'Immutable identifier of the agreement text version the applicant accepted.';
comment on column tutor_applicants.agreement_teacher_name is
  'Name shown on and signed into the agreement at acceptance time.';
