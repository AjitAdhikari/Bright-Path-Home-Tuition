import { Card, Badge } from "@/components/ui/Card";
import { npr } from "@/lib/utils";

const tuitions = [
  ["Ramesh K.", "SEE · Maths, Science", "Baneshwor", 9000, "active"],
  ["Sita G.", "Class 6–8 · English", "Patan", 7000, "active"],
  ["Anju M.", "IELTS", "Online", 15000, "ended"],
] as const;

export default function Tuitions() {
  return (
    <div className="space-y-3">
      {tuitions.map(([name, need, area, fee, status]) => (
        <Card key={name} className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">{name}</p>
            <p className="text-sm text-ink-500">{need} · {area}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-ink-900">{npr(fee)}/mo</span>
            <Badge tone={status === "active" ? "success" : "neutral"}>{status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
