import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/** Tutor approval queue. Pull from tutor_profiles where verification_status='pending'. */
const queue = [
  ["Anita Sharma", "BSc · 6 yrs", "Maths, Science", "Citizenship + certificate"],
  ["Bikash Thapa", "BBA · 3 yrs", "Maths, Accounts", "Citizenship only — needs certificate"],
  ["Sabina Rai", "MSc · 5 yrs", "Science", "All docs + police report"],
];

export default function TutorApprovals() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">
          Pending approval ({queue.length})
        </h2>
      </div>

      {queue.map(([name, edu, subj, docs]) => (
        <Card key={name} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
              {name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <p className="font-semibold text-ink-900">{name}</p>
              <p className="text-sm text-ink-500">{edu} · {subj}</p>
              <p className="mt-1 text-xs text-ink-400">📎 {docs}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">View docs</Button>
            <Button variant="ghost" size="sm">Needs info</Button>
            <Button size="sm">Approve</Button>
          </div>
        </Card>
      ))}

      <Card className="bg-ink-50">
        <h3 className="font-bold text-ink-900">Recently approved</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-ink-700">Hari Prasad · Class 6–8</span>
            <Badge tone="success">Approved</Badge>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-ink-700">Mina Shrestha · IELTS</span>
            <Badge tone="success">Approved</Badge>
          </li>
        </ul>
      </Card>
    </div>
  );
}
