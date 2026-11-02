import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { CASE_STATUS_LABEL } from "@/lib/constants";

const requests = [
  ["1042", "SEE · Maths, Science", "tutors_shared", "2 tutors to review"],
  ["1018", "Class 1–5 · All subjects", "active", "Classes running"],
] as const;

export default function ParentHome() {
  if (requests.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-ink-600">You have no requests yet.</p>
        <ButtonLink href="/find-tutor" className="mt-4">Post a requirement</ButtonLink>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(([id, need, status, hint]) => (
        <Link key={id} href={`/parent/requests/${id}`}>
          <Card className="flex items-center justify-between transition-shadow hover:shadow-lift">
            <div>
              <p className="font-semibold text-ink-900">{need}</p>
              <p className="text-sm text-ink-500">{hint}</p>
            </div>
            <Badge tone={status === "active" ? "success" : "brand"}>
              {CASE_STATUS_LABEL[status as keyof typeof CASE_STATUS_LABEL]}
            </Badge>
          </Card>
        </Link>
      ))}
    </div>
  );
}
