"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { submitForReview } from "./actions";

const CV_REQUIRED_MSG =
  "Please upload your CV/Resume before submitting your application.";

export function SubmitBar({ hasCv }: { hasCv: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onSubmit() {
    setError(null);
    if (!hasCv) {
      setError(CV_REQUIRED_MSG);
      return;
    }
    startTransition(async () => {
      const res = await submitForReview();
      if (res.ok) {
        setDone(true);
        router.push("/tutor/application-status");
        router.refresh();
      } else {
        setError(res.error ?? "Could not submit. Please try again.");
      }
    });
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-foreground">
            Submit your application for review
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Our admin team reviews your documents and gets back to you by email.
          </p>
        </div>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={pending || done || !hasCv}
          title={!hasCv ? CV_REQUIRED_MSG : undefined}
        >
          {done ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Submitted
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden />
              {pending ? "Submitting…" : "Submit for review"}
            </>
          )}
        </Button>
      </div>
      {!hasCv && !error && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
          A CV/Resume is required to submit.
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </Card>
  );
}
