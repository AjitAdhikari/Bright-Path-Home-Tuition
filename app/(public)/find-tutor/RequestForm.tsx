"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  PhoneCall,
} from "lucide-react";
import { submitRequest, type RequestState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { MatchList } from "@/components/tutors/MatchCard";
import { BOARDS, SUBJECTS, LEVELS, MODES, GENDER_PREF } from "@/lib/constants";
import { cn } from "@/lib/utils";

const initial: RequestState = { ok: false };

const STEP_LABELS = ["About you", "The tuition", "Where & budget", "Your matches"];

/** Which field names live on each step (drives validation + error routing). */
const STEP_FIELDS: Record<number, string[]> = {
  1: ["contact_name", "phone"],
  2: ["child_grade", "subjects"],
  3: ["area", "budget"],
};
const INPUT_STEPS = [1, 2, 3];
const LAST_INPUT_STEP = 3;

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

export function RequestForm() {
  const [state, action, pending] = useActionState(submitRequest, initial);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  // Route server-side field errors back to the step that owns the failing
  // field, so the stepper jumps the parent to exactly where the fix is needed.
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
  }, [state]);

  /** Validate one field by name against the live form; returns an error or "". */
  function checkField(name: string): string {
    const form = formRef.current;
    if (!form) return "";
    const el = form.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;

    switch (name) {
      case "contact_name": {
        const v = el?.value.trim() ?? "";
        return v.length < 2 ? "Please enter your name." : "";
      }
      case "phone": {
        const v = el?.value.trim() ?? "";
        return /^9\d{9}$/.test(v)
          ? ""
          : "Enter a valid 10-digit mobile starting with 9.";
      }
      case "child_grade": {
        const v = el?.value.trim() ?? "";
        return v.length < 1 ? "Please select a class / level." : "";
      }
      case "subjects": {
        const checked = form.querySelectorAll(
          'input[name="subjects"]:checked'
        ).length;
        return checked === 0 ? "Pick at least one subject." : "";
      }
      case "area": {
        const v = el?.value.trim() ?? "";
        return v.length < 2 ? "Where should the tutor come?" : "";
      }
      case "budget": {
        const raw = el?.value.trim() ?? "";
        const n = Number(raw);
        return raw !== "" && Number.isFinite(n) && n >= 1000
          ? ""
          : "Enter a monthly budget of at least 1000.";
      }
      default:
        return "";
    }
  }

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
   * update error + completion state exactly once, and report the first invalid
   * step/field.
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
    else setStep((s) => Math.min(s + 1, LAST_INPUT_STEP));
  }

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
   * The ONE place the form is allowed to actually submit. On steps 1–2, Enter
   * only advances; only the last input step may submit, and only once every
   * input step is valid.
   */
  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (pending) {
      e.preventDefault();
      return;
    }
    if (step < LAST_INPUT_STEP) {
      e.preventDefault();
      goNext();
      return;
    }
    const { firstStep, firstField } = runValidation(INPUT_STEPS);
    if (firstStep) {
      e.preventDefault();
      setStep(firstStep);
      focusField(firstField);
    }
  }

  /** Clear a field's error as the user edits it, and drop the step's completed
   *  mark if the edit made it invalid. */
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

  /* ── Step 4: submitted → matches / tracking ──────────────────── */
  if (state.ok) {
    const matches = state.matches ?? [];
    return (
      <div className="space-y-6">
        <Stepper step={4} completed={new Set([1, 2, 3])} />

        <Card className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            Got it — thank you!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            {matches.length > 0
              ? `Here ${matches.length === 1 ? "is a verified tutor" : `are ${matches.length} verified tutors`} who match your requirement. A real person from Bright Path will also call within a few hours to confirm the details and arrange a free demo.`
              : "A real person from Bright Path will call you within a few hours (often the same day) to confirm the details and send you 2–3 verified tutors."}
          </p>

          {state.requestId && (
            <p className="mx-auto mt-4 inline-block rounded-lg bg-muted px-4 py-2 font-mono text-sm font-semibold text-foreground">
              Request ID: {state.requestId.slice(0, 8).toUpperCase()}
            </p>
          )}

          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <PhoneCall className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Keep your phone handy — the call comes from a Nepali number.
          </p>
        </Card>

        {matches.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-bold text-foreground">
              Tutors matched to your requirement
            </h3>
            <MatchList matches={matches} />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Contact details are shared once you pick a tutor and we confirm
              the match — this keeps everyone safe.
            </p>
          </div>
        )}
      </div>
    );
  }

  const invalidCount = STEP_FIELDS[step]?.filter((f) => errors[f]).length ?? 0;

  /* ── Steps 1–3: the wizard ───────────────────────────────────── */
  return (
    <div className="space-y-6">
      <Stepper step={step} completed={completed} onJump={goToStep} />

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
                <Label>Your name</Label>
                <Input
                  name="contact_name"
                  autoComplete="name"
                  placeholder="e.g. Sita Gurung"
                  aria-invalid={!!errors.contact_name}
                />
                <Msg error={errors.contact_name} />
              </div>
              <div>
                <Label hint="we call to verify">Mobile number</Label>
                <Input
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  placeholder="98XXXXXXXX"
                  aria-invalid={!!errors.phone}
                />
                <Msg error={errors.phone} />
              </div>
            </div>
          </Card>
        </div>

        {/* Step 2 — About the tuition */}
        <div className={cn(step !== 2 && "hidden")}>
          <Card className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              About the tuition
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Class / level</Label>
                <Select
                  name="child_grade"
                  defaultValue=""
                  aria-invalid={!!errors.child_grade}
                >
                  <option value="" disabled>
                    Select a level
                  </option>
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </Select>
                <Msg error={errors.child_grade} />
              </div>
              <div>
                <Label>School board</Label>
                <Select name="board" defaultValue="NEB">
                  {BOARDS.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label hint="pick all that apply">Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <label
                    key={s}
                    className="cursor-pointer rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <input
                      type="checkbox"
                      name="subjects"
                      value={s}
                      className="sr-only"
                    />
                    {s}
                  </label>
                ))}
              </div>
              <Msg error={errors.subjects} />
            </div>
          </Card>
        </div>

        {/* Step 3 — Where & budget */}
        <div className={cn(step !== 3 && "hidden")}>
          <Card className="space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Where & budget
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label>Area / tole</Label>
                <Input
                  name="area"
                  placeholder="e.g. Baneshwor, Kathmandu"
                  aria-invalid={!!errors.area}
                />
                <Msg error={errors.area} />
              </div>
              <div>
                <Label>Mode</Label>
                <Select name="mode" defaultValue="Home">
                  {MODES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label hint="per month, NPR">Budget</Label>
                <Input
                  name="budget"
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  step={500}
                  placeholder="8000"
                  aria-invalid={!!errors.budget}
                />
                <Msg error={errors.budget} />
              </div>
              <div>
                <Label hint="optional">Tutor gender</Label>
                <Select name="gender_pref" defaultValue="Any">
                  {GENDER_PREF.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <Label hint="shared only after you confirm a tutor">
                Full address
              </Label>
              <Input
                name="full_address"
                placeholder="House no., street — kept private"
              />
            </div>
            <div>
              <Label hint="optional">Anything else?</Label>
              <Textarea
                name="notes"
                placeholder="e.g. prefers evenings, exam in two months…"
              />
            </div>
          </Card>
        </div>

        {/* Nav controls */}
        <div className="flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back
            </Button>
          ) : (
            <span />
          )}

          {step < LAST_INPUT_STEP ? (
            // Distinct `key` from the submit button so React never reuses this
            // DOM node and flips its type to "submit" mid-click.
            <Button key="next-btn" type="button" onClick={goNext} disabled={pending}>
              Next <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : (
            <Button key="submit-btn" type="submit" size="lg" disabled={pending}>
              {pending ? "Sending…" : "Send my requirement"}
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          No payment now. We only charge after you confirm a tutor you like.
        </p>
      </form>
    </div>
  );
}
