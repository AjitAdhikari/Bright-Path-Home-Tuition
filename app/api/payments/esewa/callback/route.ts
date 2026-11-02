import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyEsewa } from "@/lib/payments/esewa";

/**
 * eSewa redirects here with a base64 `data` param. We re-verify with eSewa's
 * status API before trusting it, then flip the payment to paid and confirm
 * the case. Uses the service-role client because there's no user session.
 */
export async function GET(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const url = new URL(req.url);
  const encoded = url.searchParams.get("data");
  if (!encoded) return NextResponse.redirect(`${site}/parent?payment=failed`);

  let decoded: { transaction_uuid?: string; total_amount?: string };
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return NextResponse.redirect(`${site}/parent?payment=failed`);
  }

  const reference = decoded.transaction_uuid;
  const amount = Number(String(decoded.total_amount ?? "0").replace(/,/g, ""));
  if (!reference) return NextResponse.redirect(`${site}/parent?payment=failed`);

  const check = await verifyEsewa(reference, amount);
  if (!check.paid) return NextResponse.redirect(`${site}/parent?payment=failed`);

  const supabase = createAdminClient();
  await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("gateway_ref", reference);

  // TODO: move case to "confirmed", create tuitions row, notify both sides.
  return NextResponse.redirect(`${site}/parent?payment=success`);
}
