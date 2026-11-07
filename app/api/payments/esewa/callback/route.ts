import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyEsewa } from "@/lib/payments/esewa";

export async function GET(req: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  const fail = NextResponse.redirect(`${site}/parent?payment=failed`);

  const url = new URL(req.url);
  const encoded = url.searchParams.get("data");
  if (!encoded) return fail;

  let decoded: { transaction_uuid?: string };
  try {
    decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return fail;
  }

  const reference = decoded.transaction_uuid;
  if (!reference) return fail;

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

  const amount = Math.round(Number(row.amount));
  const check = await verifyEsewa(reference, amount);
  if (!check.paid) return fail;

  await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "pending"); // guard against a concurrent callback

  return NextResponse.redirect(`${site}/parent?payment=success`);
}
