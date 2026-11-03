"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  PartyPopper,
  AlertCircle,
  Paperclip,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Clock,
  Mail,
} from "lucide-react";
import { submitApplication, type TutorState } from "./actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { LEVELS, DOC_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initial: TutorState = { ok: false };

const STEP_LABELS = ["About you", "Teaching profile", "Documents", "Verification"];

/** Which field names live on each step (drives validation + error routing). */
const STEP_FIELDS: Record<number, string[]> = {
  1: ["full_name", "phone", "email"],
  2: ["education", "experience_years", "areas", "levels", "bio"],
  3: DOC_TYPES.filter((d) => d.requirement === "required").map((d) => d.type),
};
const INPUT_STEPS = [1, 2, 3];

/** Reverse lookup: field name → step it belongs to. */
const FIELD_STEP: Record<string, number> = Object.fromEntries(
  Object.entries(STEP_FIELDS).flatMap(([n, fields]) =>
    fields.map((f) => [f, Number(n)])
  )
);

type Errors = Record<string, string>;

/* ── Field error line ─────────────────────────────────────────── */
function Msg({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {error}
    </p>
  );
}

function Stepper({
  step,
  completed,
  onJump,
}: {
  step: number;
  completed: Set<number>;
  onJump?: (n: number) => void;
}) {
  return (
    <ol className="flex items-center">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = completed.has(n) && n !== step;
        const active = n === step;
        // Reachable by click: the current step, any earlier step, or the next
        // step after the last completed one. Future steps stay locked until the
        // ones before them validate (enforced again in onJump).
        const reachable =
          !!onJump && (n <= step || completed.has(n) || completed.has(n - 1));
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => reachable && onJump?.(n)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
                  reachable ? "cursor-pointer" : "cursor-not-allowed",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : n}
              </button>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {n < STEP_LABELS.length && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full transition-colors",
                  completed.has(n) ? "bg-primary" : "bg-border"
                )}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function FileField({
  type,
  label,
  note,
  accept,
  multiple,
  required,
  error,
}: {
  type: string;
  label: string;
  note: string;
  accept: string;
  multiple: boolean;
  required: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label hint={required ? undefined : "optional"}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <input
        type="file"
        name={type}
        accept={accept}
        multiple={multiple}
        aria-invalid={!!error}
        className={cn(
          "block w-full cursor-pointer rounded-lg border bg-card text-sm text-muted-foreground transition-colors file:mr-4 file:cursor-pointer file:border-0 file:bg-muted file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-border focus:outline-none focus:ring-2 focus:ring-ring/40",
          error ? "border-destructive" : "border-input focus:border-ring"
        )}
      />
      <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      <Msg error={error} />
    </div>
  );
}

export function TutorForm() {
  const [state, action, pending] = useActionState(submitApplication, initial);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  // Route server-side errors back to the step that actually owns the failing
  // field — never blindly to Step 1. A general error (duplicate email, a
  // document problem, a network/server failure) is shown as a banner without
  // moving the stepper or clearing any entered data.
  useEffect(() => {
    const fe = state.fieldErrors;
    if (fe && Object.keys(fe).length) {
      setErrors((prev) => {
        const merged = { ...prev };
        for (const [k, v] of Object.entries(fe)) if (v?.[0]) merged[k] = v[0];
        return merged;
      });
      setCompleted((prev) => {
        const set = new Set(prev);
        for (const k of Object.keys(fe)) {
          const owning = FIELD_STEP[k];
          if (owning) set.delete(owning);
        }
        return set;
      });
      const steps = Object.keys(fe)
        .map((k) => FIELD_STEP[k])
        .filter((n): n is number => !!n);
      if (steps.length) setStep(Math.min(...steps));
    }
    // No `else` — a general `state.error` leaves the active step untouched.
  }, [state]);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /** Validate one field by name against the live form; returns an error or "". */
  function checkField(name: string): string {
    const form = formRef.current;
    if (!form) return "";
    const el = form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | RadioNodeList
      | null;

    switch (name) {
      case "full_name": {
        const v = (el as HTMLInputElement)?.value.trim() ?? "";
        return v.length < 2 ? "Please enter your full name." : "";
      }
      case "phone": {
        const v = (el as HTMLInputElement)?.value.trim() ?? "";
        return /^9\d{9}$/.test(v)
          ? ""
          : "Enter a valid 10-digit mobile starting with 9.";
      }
      case "email": {
        const v = (el as HTMLInputElement)?.value.trim() ?? "";
        return EMAIL_RE.test(v) ? "" : "Enter a valid email address.";
      }
      case "education": {
        const v = (el as HTMLInputElement)?.value.trim() ?? "";
        return v.length < 2 ? "Tell us your highest qualification." : "";
      }
      case "experience_years": {
        const raw = (el as HTMLInputElement)?.value.trim() ?? "";
        if (raw === "") return "";
        const n = Number(raw);
        return Number.isFinite(n) && n >= 0 && n <= 50
          ? ""
          : "Enter a number between 0 and 50.";
      }
      case "areas": {
        const v = (el as HTMLInputElement)?.value.trim() ?? "";
        return v.length < 2 ? "Where can you travel to teach?" : "";
      }
      case "bio": {
        const v = (el as HTMLTextAreaElement)?.value.trim() ?? "";
        return v.length < 20
          ? "A few sentences (at least 20 characters) helps parents trust you."
          : "";
      }
      case "levels": {
        const checked = form.querySelectorAll(
          'input[name="levels"]:checked'
        ).length;
        return checked === 0 ? "Choose at least one level you teach." : "";
      }
      default: {
        // Required document fields.
        const spec = DOC_TYPES.find((d) => d.type === name);
        if (spec) {
          const input = form.elements.namedItem(name) as HTMLInputElement | null;
          const has = (input?.files?.length ?? 0) > 0;
          return has ? "" : `Please upload your ${spec.label}.`;
        }
        return "";
      }
    }
  }

  /** Pure validity check for a step — no state changes, no focus. Used to keep
   *  the "completed" markers honest without disturbing the UI. */
  function stepIsValid(n: number): boolean {
    return (STEP_FIELDS[n] ?? []).every((f) => !checkField(f));
  }

  function markCompleted(n: number, done: boolean) {
    setCompleted((prev) => {
      const nextSet = new Set(prev);
      if (done) nextSet.add(n);
      else nextSet.delete(n);
      return nextSet;
    });
  }

  function focusField(name: string) {
    const el = formRef.current?.elements.namedItem(name) as
      | HTMLElement
      | RadioNodeList
      | null;
    const focusable = el instanceof RadioNodeList ? (el[0] as HTMLElement) : el;
    focusable?.focus?.();
    focusable?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }

  /**
   * Validate the given steps in a SINGLE pass: collect every field error,
   * update error + completion state exactly once (no stale-closure batching
   * bugs), and report the first invalid step/field. The caller decides where to
   * navigate — nothing here forces Step 1.
   */
  function runValidation(steps: number[]): {
    firstStep: number;
    firstField: string;
  } {
    const found: Errors = {};
    let firstStep = 0;
    let firstField = "";
    for (const n of steps) {
      for (const name of STEP_FIELDS[n] ?? []) {
        const err = checkField(name);
        if (err) {
          found[name] = err;
          if (!firstStep) {
            firstStep = n;
            firstField = name;
          }
        }
      }
    }
    setErrors((prev) => {
      const nextErrors = { ...prev };
      for (const n of steps)
        for (const f of STEP_FIELDS[n] ?? []) delete nextErrors[f];
      return { ...nextErrors, ...found };
    });
    setCompleted((prev) => {
      const set = new Set(prev);
      for (const n of steps) {
        const ok = (STEP_FIELDS[n] ?? []).every((f) => !found[f]);
        if (ok) set.add(n);
        else set.delete(n);
      }
      return set;
    });
    return { firstStep, firstField };
  }

  function goNext() {
    if (pending) return;
    const { firstField } = runValidation([step]);
    if (firstField) focusField(firstField);
    else setStep((s) => Math.min(s + 1, 3));
  }

  /**
   * Jump to a step via the stepper. Backward is always allowed; forward is only
   * allowed once every step in between validates, so the indicators can't bypass
   * validation. Navigates to the first invalid step if any.
   */
  function goToStep(target: number) {
    if (pending || target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    const range = INPUT_STEPS.filter((k) => k >= step && k < target);
    const { firstStep, firstField } = runValidation(range);
    if (firstStep) {
      setStep(firstStep);
      focusField(firstField);
    } else {
      setStep(target);
    }
  }

  /**
   * The ONE place the form is allowed to actually submit. Because there is a
   * single <form>, pressing Enter (or any implicit submit) on an earlier step
   * would otherwise run the final-submit validation (incl. Step 3's CV) while
   * the user is on Step 1. So: on steps 1–2, Enter only advances the current
   * step; only Step 3 may submit, and only once every input step is valid.
   */
  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (pending) {
      e.preventDefault();
      return;
    }
    if (step < 3) {
      e.preventDefault();
      goNext();
      return;
    }
    // Final step: validate all input steps; block + navigate on the first
    // invalid one. Only a fully valid form reaches the server action.
    const { firstStep, firstField } = runValidation(INPUT_STEPS);
    if (firstStep) {
      e.preventDefault();
      setStep(firstStep);
      focusField(firstField);
    }
  }

  /** Clear a field's error as the user edits it, and drop the step's completed
   *  mark if the edit made it invalid (so forward progress re-locks). */
  function clearOnInput(e: React.FormEvent) {
    const target = e.target as HTMLInputElement;
    const name = target?.name;
    if (!name) return;
    if (errors[name]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
    const owningStep = FIELD_STEP[name];
    if (owningStep && completed.has(owningStep) && !stepIsValid(owningStep)) {
      markCompleted(owningStep, false);
    }
  }

  /* ── Step 4: submitted → verification / tracking ─────────────── */
  if (state.ok) {
    return (
      <div className="space-y-6">
        <Stepper step={4} completed={new Set([1, 2, 3])} />
        <Card className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <PartyPopper className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            Your application has been submitted!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Thank you for applying to become a tutor at Bright Path Home Tuition.
            Your application and documents are now{" "}
            <strong>pending admin verification</strong>.
          </p>
          {state.applicationNumber && (
            <p className="mx-auto mt-4 inline-block rounded-lg bg-muted px-4 py-2 font-mono text-sm font-semibold text-foreground">
              Application ID: {state.applicationNumber}
            </p>
          )}

          <ul className="mx-auto mt-6 max-w-sm space-y-3 text-left">
            <li className="flex items-start gap-3 text-sm">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">
                Our team verifies your documents and qualifications.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">
                When approved, you&apos;ll get an email with a link to set your
                password.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-muted-foreground">
                Only after approval can you log in to your Teacher Dashboard.
              </span>
            </li>
          </ul>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/application-status">
              Track my application <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/login" variant="outline">
              Go to login
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  const invalidCount = STEP_FIELDS[step]?.filter((f) => errors[f]).length ?? 0;

  /* ── Steps 1–3: the wizard ───────────────────────────────────── */
  return (
    <div className="space-y-6">
      <Stepper step={step} completed={completed} onJump={goToStep} />

      <div className="flex justify-end">
        <ButtonLink href="/application-status" variant="ghost" size="sm">
          <Search className="h-4 w-4" aria-hidden /> Track my application
        </ButtonLink>
      </div>

      <form
        ref={formRef}
        action={action}
        noValidate
        onSubmit={onFormSubmit}
        onInput={clearOnInput}
        onChange={clearOnInput}
        className="space-y-6"
      >
        {state.error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {state.error}
          </div>
        )}
        {invalidCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            Please fix the highlighted field{invalidCount > 1 ? "s" : ""} to
            continue.
          </div>
        )}

        {/* Step 1 — About you */}
        <div className={cn(step !== 1 && "hidden")}>
          <Card className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              About you
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input name="full_name" autoComplete="name" placeholder="As on your citizenship" aria-invalid={!!errors.full_name} />
                <Msg error={errors.full_name} />
              </div>
              <div>
                <Label>Mobile number</Label>
                <Input name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" placeholder="98XXXXXXXX" aria-invalid={!!errors.phone} />
                <Msg error={errors.phone} />
              </div>
              <div className="sm:col-span-2">
                <Label hint="we email you here about your application">Email</Label>
                <Input name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
                <Msg error={errors.email} />
              </div>
            </div>
          </Card>
        </div>

        {/* Step 2 — Teaching profile */}
        <div className={cn(step !== 2 && "hidden")}>
          <Card className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Teaching profile</h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Highest qualification</Label>
                <Input name="education" placeholder="e.g. BSc, Tribhuvan University" aria-invalid={!!errors.education} />
                <Msg error={errors.education} />
              </div>
              <div>
                <Label hint="years">Experience</Label>
                <Input name="experience_years" type="number" inputMode="numeric" min={0} max={50} placeholder="3" aria-invalid={!!errors.experience_years} />
                <Msg error={errors.experience_years} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select name="gender" defaultValue="Male">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </Select>
              </div>
              <div>
                <Label>Areas you can travel to</Label>
                <Input name="areas" placeholder="e.g. Baneshwor, Koteshwor" aria-invalid={!!errors.areas} />
                <Msg error={errors.areas} />
              </div>
            </div>

            <div>
              <Label>Levels you teach</Label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <label
                    key={l}
                    className="cursor-pointer rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <input type="checkbox" name="levels" value={l} className="sr-only" />
                    {l}
                  </label>
                ))}
              </div>
              <Msg error={errors.levels} />
            </div>

            <div>
              <Label hint="parents read this first">Short bio</Label>
              <Textarea name="bio" placeholder="Tell parents how you teach and what makes students comfortable with you." aria-invalid={!!errors.bio} />
              <Msg error={errors.bio} />
            </div>
          </Card>
        </div>

        {/* Step 3 — Verification documents */}
        <div className={cn(step !== 3 && "hidden")}>
          <Card className="space-y-5">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                Verification documents
              </h3>
            </div>
            <p className="-mt-2 text-sm text-muted-foreground">
              Upload directly here — no account needed. Only Bright Path admins
              can see these. Max 5 MB per file. Fields marked{" "}
              <span className="text-destructive">*</span> are required.
            </p>
            <div className="grid gap-5">
              {DOC_TYPES.map((spec) => (
                <FileField
                  key={spec.type}
                  type={spec.type}
                  label={spec.label}
                  note={spec.note}
                  accept={spec.accept}
                  multiple={spec.multiple}
                  required={spec.requirement === "required"}
                  error={errors[spec.type]}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Nav controls */}
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </Button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            // Distinct `key` from the submit button so React never reuses this
            // DOM node and flips its type to "submit" mid-click (which would
            // auto-submit the form the moment Next advances to Step 3).
            <Button key="next-btn" type="button" onClick={goNext} disabled={pending}>
              Next <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button key="submit-btn" type="submit" size="lg" disabled={pending}>
              {pending ? "Submitting…" : "Submit application"}
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By submitting you agree to Bright Path&apos;s tutor terms and code of
          conduct. Submitting does not guarantee approval.
        </p>
      </form>
    </div>
  );
}
