import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const docs = [
  ["Citizenship / National ID", "required", "uploaded"],
  ["Latest academic certificate", "required", "missing"],
  ["Police character report", "optional — for teaching young children", "missing"],
  ["Teaching experience letter", "optional", "missing"],
] as const;

export default function Documents() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink-900">Verification documents</h2>
        <p className="mt-1 text-sm text-ink-500">
          PDF, JPG or PNG · up to 5 MB each. Only Bright Path admins can see these —
          never other tutors or parents.
        </p>
      </div>

      {docs.map(([name, note, state]) => (
        <Card key={name} className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">{name}</p>
            <p className="text-xs text-ink-400">{note}</p>
          </div>
          {state === "uploaded" ? (
            <Badge tone="success">✓ Uploaded</Badge>
          ) : (
            <Button variant="outline" size="sm">Upload</Button>
          )}
        </Card>
      ))}
    </div>
  );
}
