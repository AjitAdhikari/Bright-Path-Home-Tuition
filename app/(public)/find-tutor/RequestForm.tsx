"use client";

import { useActionState } from "react";
import { submitRequest, type RequestState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { MatchList } from "@/components/tutors/MatchCard";
import { BOARDS, SUBJECTS, LEVELS, MODES, GENDER_PREF } from "@/lib/constants";

const initial: RequestState = { ok: false };

function Err({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export function RequestForm() {
  const [state, action, pending] = useActionState(submitRequest, initial);

  if (state.ok) {
    const matches = state.matches ?? [];
    return (
      <div className="space-y-6">
        <Card className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-ink-900">
            Got it — thank you!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-ink-600">
            {matches.length > 0
              ? `Here ${matches.length === 1 ? "is a verified tutor" : `are ${matches.length} verified tutors`} who match your requirement. A real person from Bright Path will also call within a few hours to confirm the details and arrange a free demo.`
              : "A real person from Bright Path will call you within a few hours (often the same day) to confirm the details and send you 2–3 verified tutors."}
          </p>
          <p className="mt-4 text-sm text-ink-400">
            Keep your phone handy — the call comes from a Nepali number.
          </p>
        </Card>

        {matches.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-bold text-ink-900">
              Tutors matched to your requirement
            </h3>
            <MatchList matches={matches} />
            <p className="mt-4 text-center text-sm text-ink-500">
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">
          About you
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Your name</Label>
            <Input name="contact_name" placeholder="e.g. Sita Gurung" />
            <Err errors={state.fieldErrors?.contact_name} />
          </div>
          <div>
            <Label hint="we call to verify">Mobile number</Label>
            <Input name="phone" inputMode="numeric" placeholder="98XXXXXXXX" />
            <Err errors={state.fieldErrors?.phone} />
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">
          About the tuition
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Class / level</Label>
            <Select name="child_grade" defaultValue="">
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
                className="cursor-pointer rounded-full border border-ink-200 bg-card px-3.5 py-1.5 text-sm text-ink-700 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800"
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
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">
          Where & budget
        </h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Area / tole</Label>
            <Input name="area" placeholder="e.g. Baneshwor, Kathmandu" />
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
            <Input name="budget" inputMode="numeric" placeholder="8000" />
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
        <p className="text-xs text-ink-400">
          No payment now. We only charge after you confirm a tutor you like.
        </p>
      </div>
    </form>
  );
}
