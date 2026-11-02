import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyKhalti } from "@/lib/payments/khalti";

/** Khalti returns with ?pidx=...&purchase_order_id=... — verify via lookup. */
export async function GET(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const url = new URL(req.url);
  const pidx = url.searchParams.get("pidx");
  const reference = url.searchParams.get("purchase_order_id");
  if (!pidx || !reference) {
    return NextResponse.redirect(`${site}/parent?payment=failed`);
  }

  const check = await verifyKhalti(pidx);
  if (!check.paid) return NextResponse.redirect(`${site}/parent?payment=failed`);

  const supabase = createAdminClient();
  await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("gateway_ref", reference);

  return NextResponse.redirect(`${site}/parent?payment=success`);
}
