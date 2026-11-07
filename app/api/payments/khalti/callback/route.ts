import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyKhalti } from "@/lib/payments/khalti";

/**
 * Khalti returns with ?pidx=...&purchase_order_id=... — verify via lookup.
 *
 * We trust our own pending row, not the redirect: look the payment up by
 * reference, confirm Khalti reports it Completed for the amount WE stored
 * (Khalti amounts are in paisa = NPR × 100), and only move a still-pending row
 * to paid (idempotent — a replayed callback can't double-process).
 */
export async function GET(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const fail = NextResponse.redirect(`${site}/parent?payment=failed`);

  const url = new URL(req.url);
  const pidx = url.searchParams.get("pidx");
  const reference = url.searchParams.get("purchase_order_id");
  if (!pidx || !reference) return fail;

  const supabase = createAdminClient();

  const { data: rowData } = await supabase
    .from("payments")
    .select("id, amount, status")
    .eq("gateway_ref", reference)
    .maybeSingle();
  const row = rowData as { id: string; amount: number; status: string } | null;
  if (!row) return fail;

  if (row.status === "paid") {
    return NextResponse.redirect(`${site}/parent?payment=success`);
  }
  if (row.status !== "pending") return fail;

  const check = await verifyKhalti(pidx);
  if (!check.paid) return fail;

  // Reconcile amount: Khalti reports total_amount in paisa.
  const expectedPaisa = Math.round(Number(row.amount) * 100);
  const reportedPaisa = Number(check.raw?.total_amount ?? NaN);
  if (!Number.isFinite(reportedPaisa) || reportedPaisa !== expectedPaisa) {
    return fail;
  }

  await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "pending");

  return NextResponse.redirect(`${site}/parent?payment=success`);
}
