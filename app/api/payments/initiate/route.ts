import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildEsewaPayload } from "@/lib/payments/esewa";
import { initiateKhalti } from "@/lib/payments/khalti";

const schema = z.object({
  tuitionId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(["esewa", "khalti"]),
});

/**
 * Creates a `payments` row (status=pending, unique reference) then returns the
 * gateway redirect details. We never mark anything paid here — only the
 * verified callback does that.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { tuitionId, amount, method } = parsed.data;
  const reference = crypto.randomUUID();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  const supabase = await createClient();
  // `as never` until `npm run db:types` regenerates the schema types.
  const { error } = await supabase.from("payments").insert({
    tuition_id: tuitionId,
    direction: "in",
    amount,
    method,
    gateway_ref: reference,
    status: "pending",
  } as never);
  if (error) {
    return NextResponse.json({ error: "Could not start payment" }, { status: 500 });
  }

  if (method === "esewa") {
    const payload = buildEsewaPayload({
      amount,
      transactionUuid: reference,
      successUrl: `${site}/api/payments/esewa/callback`,
      failureUrl: `${site}/parent?payment=failed`,
    });
    return NextResponse.json({ gateway: "esewa", ...payload });
  }

  const khalti = await initiateKhalti({
    amountNpr: amount,
    purchaseOrderId: reference,
    purchaseOrderName: "Bright Path first-month commission",
    returnUrl: `${site}/api/payments/khalti/callback`,
    websiteUrl: site,
  });
  return NextResponse.json({ gateway: "khalti", redirect: khalti.payment_url });
}
