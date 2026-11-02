"use client";

import { useActionState } from "react";
import { registerTutor, type TutorState } from "./actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { LEVELS } from "@/lib/constants";

const initial: TutorState = { ok: false };

function Err({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{errors[0]}</p>;
}

export function TutorForm() {
  const [state, action, pending] = useActionState(registerTutor, initial);

  if (state.ok) {
    return (
      <Card className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-brand-700 text-2xl">
          🎉
        </div>
        <h2 className="mt-4 text-2xl font-bold text-ink-900">
          Welcome aboard — now let&apos;s verify you
        </h2>
        <p className="mx-auto mt-2 max-w-md text-ink-600">
          Your account is created. The next step is uploading your citizenship
          /ID and your latest certificate, then a short interview call. You
          become visible to parents only after you&apos;re approved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/tutor/documents">Upload documents</ButtonLink>
          <ButtonLink href="/tutor" variant="outline">Go to dashboard</ButtonLink>
        </div>
      </Card>
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
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">Account</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input name="full_name" placeholder="As on your citizenship" />
            <Err errors={state.fieldErrors?.full_name} />
          </div>
          <div>
            <Label>Mobile number</Label>
            <Input name="phone" inputMode="numeric" placeholder="98XXXXXXXX" />
            <Err errors={state.fieldErrors?.phone} />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" placeholder="you@example.com" />
            <Err errors={state.fieldErrors?.email} />
          </div>
          <div>
            <Label hint="min 8 characters">Password</Label>
            <Input name="password" type="password" placeholder="••••••••" />
            <Err errors={state.fieldErrors?.password} />
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink-400">Teaching profile</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Highest qualification</Label>
            <Input name="education" placeholder="e.g. BSc, Tribhuvan University" />
            <Err errors={state.fieldErrors?.education} />
          </div>
          <div>
            <Label hint="years">Experience</Label>
            <Input name="experience_years" inputMode="numeric" placeholder="3" />
            <Err errors={state.fieldErrors?.experience_years} />
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
            <Input name="areas" placeholder="e.g. Baneshwor, Koteshwor" />
            <Err errors={state.fieldErrors?.areas} />
          </div>
        </div>

        <div>
          <Label>Levels you teach</Label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <label
                key={l}
                className="cursor-pointer rounded-full border border-ink-200 bg-card px-3.5 py-1.5 text-sm text-ink-700 transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-800"
              >
                <input type="checkbox" name="levels" value={l} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
          <Err errors={state.fieldErrors?.levels} />
        </div>

        <div>
          <Label hint="parents read this first">Short bio</Label>
          <Textarea name="bio" placeholder="Tell parents how you teach and what makes students comfortable with you." />
          <Err errors={state.fieldErrors?.bio} />
        </div>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Creating account…" : "Create my tutor account"}
        </Button>
        <p className="text-xs text-ink-400">
          By continuing you agree to Bright Path&apos;s tutor terms and code of conduct.
        </p>
      </div>
    </form>
  );
}
