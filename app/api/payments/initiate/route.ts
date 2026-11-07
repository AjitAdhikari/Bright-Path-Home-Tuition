import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildEsewaPayload } from "@/lib/payments/esewa";
import { initiateKhalti } from "@/lib/payments/khalti";
import { limitByIp } from "@/lib/rate-limit";

const schema = z.object({
  tuitionId: z.string().uuid(),
  method: z.enum(["esewa", "khalti"]),
});

export async function POST(req: Request) {
  const rl = await limitByIp("payment-initiate", 20, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { tuitionId, method } = parsed.data;
  const site = process.env.NEXT_PUBLIC_SITE_URL!;

  const supabase = await createClient();

  // Must be authenticated — no anonymous payment initiation.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // Load the tuition and verify ownership + derive the amount. RLS already
  // scopes reads to the parent/tutor on the tuition (and admins); this also
  // gives us the authoritative fee so the amount can't be set by the client.
  const { data: tuitionRow, error: tErr } = await supabase
    .from("tuitions")
    .select("id, monthly_fee, commission_rate, match:matches(request:requests(parent_id))")
    .eq("id", tuitionId)
    .maybeSingle();

  const tuition = tuitionRow as
    | {
        id: string;
        monthly_fee: number;
        commission_rate: number;
        match: { request: { parent_id: string | null } | null } | null;
      }
    | null;

  if (tErr || !tuition) {
    return NextResponse.json({ error: "Tuition not found." }, { status: 404 });
  }

  const parentId = tuition.match?.request?.parent_id ?? null;
  if (parentId !== user.id) {
    // Not the owning parent. (Admins reach payment tooling through the admin
    // area, not this parent-facing endpoint.)
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  // Authoritative, server-derived amount — the first-month commission.
  const amount = Math.round(
    Number(tuition.monthly_fee) * Number(tuition.commission_rate)
  );
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "This tuition has no payable amount yet." },
      { status: 409 }
    );
  }

  const reference = crypto.randomUUID();

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
