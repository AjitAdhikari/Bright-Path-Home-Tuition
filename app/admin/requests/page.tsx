import Link from "next/link";
import { Card, Badge } from "@/components/ui/Card";
import { CASE_STATUS, CASE_STATUS_LABEL, type CaseStatus } from "@/lib/constants";
import { npr } from "@/lib/utils";

/** Representative case rows; swap for a Supabase query filtered by status. */
const rows = [
  ["#1042", "Ramesh K.", "SEE · Maths", "Baneshwor", 9000, "new"],
  ["#1041", "Pooja T.", "+2 · Physics", "Kirtipur", 12000, "verified"],
  ["#1039", "Sita G.", "Class 6–8 · English", "Patan", 7000, "tutors_shared"],
  ["#1036", "Bimal R.", "Class 1–5 · All", "Thimi", 6000, "demo_scheduled"],
  ["#1030", "Anju M.", "IELTS", "Pokhara", 15000, "active"],
] as const;

export default function AdminRequests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <div className="space-y-6">
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/requests"
          className="rounded-full border border-ink-200 bg-card px-3.5 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-400"
        >
          All
        </Link>
        {CASE_STATUS.map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className="rounded-full border border-ink-200 bg-card px-3.5 py-1.5 text-sm font-medium text-ink-700 hover:border-brand-400"
          >
            {CASE_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Case</th>
              <th className="px-5 py-3 font-semibold">Parent</th>
              <th className="px-5 py-3 font-semibold">Need</th>
              <th className="px-5 py-3 font-semibold">Area</th>
              <th className="px-5 py-3 font-semibold">Budget</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map(([id, parent, need, area, budget, status]) => (
              <tr key={id} className="transition-colors hover:bg-brand-50/40">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/admin/requests/${id.replace("#", "")}`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    {id}
                  </Link>
                </td>
                <td className="px-5 py-3.5 text-ink-900">{parent}</td>
                <td className="px-5 py-3.5 text-ink-600">{need}</td>
                <td className="px-5 py-3.5 text-ink-600">{area}</td>
                <td className="px-5 py-3.5 text-ink-900">{npr(budget)}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const tone =
    status === "new"
      ? "warning"
      : status === "active" || status === "confirmed"
      ? "success"
      : status === "closed"
      ? "neutral"
      : "brand";
  return <Badge tone={tone}>{CASE_STATUS_LABEL[status]}</Badge>;
}
