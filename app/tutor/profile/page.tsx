import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import { updateTutorProfile } from "./actions";

type ProfileRow = {
  bio: string | null;
  education: string | null;
  experience_years: number | null;
  teaches_online: boolean | null;
};

export default async function TutorProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("tutor_profiles")
    .select("bio, education, experience_years, teaches_online")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const profile = (data ?? {}) as ProfileRow;

  return (
    <form action={updateTutorProfile} className="max-w-2xl space-y-6">
      <Card className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Public profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This is what parents see — keep it warm and specific. Your
            verification status can only be changed by our team.
          </p>
        </div>
        <div>
          <Label hint="parents read this first">Short bio</Label>
          <Textarea
            name="bio"
            required
            minLength={20}
            defaultValue={profile.bio ?? ""}
            placeholder="How you teach and what makes students comfortable with you."
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Education</Label>
            <Input
              name="education"
              defaultValue={profile.education ?? ""}
              placeholder="e.g. BSc, Tribhuvan University"
            />
          </div>
          <div>
            <Label hint="years">Experience</Label>
            <Input
              name="experience_years"
              type="number"
              min={0}
              max={50}
              inputMode="numeric"
              defaultValue={profile.experience_years ?? 0}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="teaches_online"
            defaultChecked={!!profile.teaches_online}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          I also teach online
        </label>
      </Card>
      <Button type="submit">Save changes</Button>
    </form>
  );
}
