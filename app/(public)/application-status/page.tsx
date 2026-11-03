import type { Metadata } from "next";
import { StatusLookup } from "./StatusLookup";

export const metadata: Metadata = { title: "Application status" };

export default function ApplicationStatusPage() {
  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Track your application
        </h1>
        <p className="mt-2 text-muted-foreground">
          Enter the Application ID from your confirmation and the email you
          applied with. No login needed.
        </p>
      </div>
      <StatusLookup />
    </div>
  );
}
