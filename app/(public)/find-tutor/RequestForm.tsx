"use client";

import { useActionState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { submitRequest, type RequestState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { MatchList } from "@/components/tutors/MatchCard";
import { BOARDS, SUBJECTS, LEVELS, MODES, GENDER_PREF } from "@/lib/constants";

const initial: RequestState = { ok: false };

function Err({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {errors[0]}
    </p>
  );
}

export function RequestForm() {
  const [state, action, pending] = useActionState(submitRequest, initial);

  if (state.ok) {
    const matches = state.matches ?? [];
    return (
      <div className="space-y-6">
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
          <p className="mt-4 text-sm text-muted-foreground">
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

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          About you
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Your name</Label>
            <Input
              name="contact_name"
              required
              minLength={2}
              autoComplete="name"
              placeholder="e.g. Sita Gurung"
              aria-invalid={!!state.fieldErrors?.contact_name}
            />
            <Err errors={state.fieldErrors?.contact_name} />
          </div>
          <div>
            <Label hint="we call to verify">Mobile number</Label>
            <Input
              name="phone"
              type="tel"
              inputMode="numeric"
              required
              pattern="9[0-9]{9}"
              maxLength={10}
              autoComplete="tel"
              title="10-digit Nepali mobile starting with 9"
              placeholder="98XXXXXXXX"
              aria-invalid={!!state.fieldErrors?.phone}
            />
            <Err errors={state.fieldErrors?.phone} />
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          About the tuition
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Class / level</Label>
            <Select
              name="child_grade"
              required
              defaultValue=""
              aria-invalid={!!state.fieldErrors?.child_grade}
            >
              <option value="" disabled>Select a level</option>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </Select>
            <Err errors={state.fieldErrors?.child_grade} />
          </div>
          <div>
            <Label>School board</Label>
            <Select name="board" defaultValue="NEB">
              {BOARDS.map((b) => <option key={b}>{b}</option>)}
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
                <input type="checkbox" name="subjects" value={s} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
          <Err errors={state.fieldErrors?.subjects} />
        </div>
      </Card>

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Where & budget
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Area / tole</Label>
            <Input
              name="area"
              required
              minLength={2}
              placeholder="e.g. Baneshwor, Kathmandu"
              aria-invalid={!!state.fieldErrors?.area}
            />
            <Err errors={state.fieldErrors?.area} />
          </div>
          <div>
            <Label>Mode</Label>
            <Select name="mode" defaultValue="Home">
              {MODES.map((m) => <option key={m}>{m}</option>)}
            </Select>
          </div>
          <div>
            <Label hint="per month, NPR">Budget</Label>
            <Input
              name="budget"
              type="number"
              inputMode="numeric"
              required
              min={1000}
              step={500}
              placeholder="8000"
              aria-invalid={!!state.fieldErrors?.budget}
            />
            <Err errors={state.fieldErrors?.budget} />
          </div>
          <div>
            <Label hint="optional">Tutor gender</Label>
            <Select name="gender_pref" defaultValue="Any">
              {GENDER_PREF.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label hint="shared only after you confirm a tutor">
            Full address
          </Label>
          <Input name="full_address" placeholder="House no., street — kept private" />
        </div>
        <div>
          <Label hint="optional">Anything else?</Label>
          <Textarea name="notes" placeholder="e.g. prefers evenings, exam in two months…" />
        </div>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Sending…" : "Send my requirement"}
        </Button>
        <p className="text-xs text-muted-foreground">
          No payment now. We only charge after you confirm a tutor you like.
        </p>
      </div>
    </form>
  );
}
