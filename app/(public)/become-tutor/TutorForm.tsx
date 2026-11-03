"use client";

import { useActionState } from "react";
import { PartyPopper, AlertCircle } from "lucide-react";
import { registerTutor, type TutorState } from "./actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { LEVELS } from "@/lib/constants";

const initial: TutorState = { ok: false };

function Err({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      {errors[0]}
    </p>
  );
}

export function TutorForm() {
  const [state, action, pending] = useActionState(registerTutor, initial);

  if (state.ok) {
    return (
      <Card className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          Welcome aboard — now let&apos;s verify you
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
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
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </div>
      )}

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Account</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input name="full_name" required minLength={2} autoComplete="name" placeholder="As on your citizenship" aria-invalid={!!state.fieldErrors?.full_name} />
            <Err errors={state.fieldErrors?.full_name} />
          </div>
          <div>
            <Label>Mobile number</Label>
            <Input name="phone" type="tel" inputMode="numeric" required pattern="9[0-9]{9}" maxLength={10} autoComplete="tel" title="10-digit Nepali mobile starting with 9" placeholder="98XXXXXXXX" aria-invalid={!!state.fieldErrors?.phone} />
            <Err errors={state.fieldErrors?.phone} />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" aria-invalid={!!state.fieldErrors?.email} />
            <Err errors={state.fieldErrors?.email} />
          </div>
          <div>
            <Label hint="min 8 characters">Password</Label>
            <Input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" aria-invalid={!!state.fieldErrors?.password} />
            <Err errors={state.fieldErrors?.password} />
          </div>
        </div>
      </Card>

      <Card className="space-y-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Teaching profile</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Highest qualification</Label>
            <Input name="education" required placeholder="e.g. BSc, Tribhuvan University" aria-invalid={!!state.fieldErrors?.education} />
            <Err errors={state.fieldErrors?.education} />
          </div>
          <div>
            <Label hint="years">Experience</Label>
            <Input name="experience_years" type="number" inputMode="numeric" min={0} max={50} placeholder="3" aria-invalid={!!state.fieldErrors?.experience_years} />
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
            <Input name="areas" required placeholder="e.g. Baneshwor, Koteshwor" aria-invalid={!!state.fieldErrors?.areas} />
            <Err errors={state.fieldErrors?.areas} />
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
          <Err errors={state.fieldErrors?.levels} />
        </div>

        <div>
          <Label hint="parents read this first">Short bio</Label>
          <Textarea name="bio" required minLength={20} placeholder="Tell parents how you teach and what makes students comfortable with you." aria-invalid={!!state.fieldErrors?.bio} />
          <Err errors={state.fieldErrors?.bio} />
        </div>
      </Card>

      <div className="flex flex-col items-center gap-3">
        <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Creating account…" : "Create my tutor account"}
        </Button>
        <p className="text-xs text-muted-foreground">
          By continuing you agree to Bright Path&apos;s tutor terms and code of conduct.
        </p>
      </div>
    </form>
  );
}
