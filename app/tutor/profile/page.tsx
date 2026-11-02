import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea } from "@/components/ui/Field";

export default function TutorProfile() {
  return (
    <form className="max-w-2xl space-y-6">
      <Card className="space-y-5">
        <h2 className="text-lg font-bold text-ink-900">Public profile</h2>
        <p className="text-sm text-ink-500">
          This is what parents see — keep it warm and specific. You can edit
          everything except your verification status.
        </p>
        <div>
          <Label>Short bio</Label>
          <Textarea defaultValue="Patient Maths & Science tutor who makes SEE prep feel manageable." />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Education</Label>
            <Input defaultValue="BSc, Tribhuvan University" />
          </div>
          <div>
            <Label>Experience (years)</Label>
            <Input defaultValue="6" inputMode="numeric" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--color-brand-600)]" />
          I also teach online
        </label>
      </Card>
      <Button>Save changes</Button>
    </form>
  );
}
