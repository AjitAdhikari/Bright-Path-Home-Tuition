/**
 * Khalti ePayment. We initiate to get a `pidx` + payment URL, then look up
 * the pidx on return to confirm. Amounts are in paisa (NPR * 100).
 */
const BASE =
  process.env.NODE_ENV === "production"
    ? "https://khalti.com/api/v2"
    : "https://dev.khalti.com/api/v2";

function headers() {
  return {
    Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function initiateKhalti(opts: {
  amountNpr: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
}) {
  const res = await fetch(`${BASE}/epayment/initiate/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      return_url: opts.returnUrl,
      website_url: opts.websiteUrl,
      amount: opts.amountNpr * 100,
      purchase_order_id: opts.purchaseOrderId,
      purchase_order_name: opts.purchaseOrderName,
    }),
  });
  if (!res.ok) throw new Error("Khalti initiate failed");
  return (await res.json()) as { pidx: string; payment_url: string };
}

export async function verifyKhalti(pidx: string) {
  const res = await fetch(`${BASE}/epayment/lookup/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ pidx }),
    cache: "no-store",
  });
  if (!res.ok) return { paid: false as const };
  const data = (await res.json()) as { status?: string; total_amount?: number };
  return { paid: data.status === "Completed" as const, raw: data };
}
