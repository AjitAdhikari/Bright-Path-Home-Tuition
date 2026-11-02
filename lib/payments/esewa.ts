import crypto from "node:crypto";

/**
 * eSewa ePay v2. The browser is redirected to the gateway with a signed
 * payload; on return we MUST verify server-side before trusting it.
 * Test merchant code EPAYTEST + its sandbox secret are in .env.example.
 */
const BASE =
  process.env.NODE_ENV === "production"
    ? "https://epay.esewa.com.np"
    : "https://rc-epay.esewa.com.np";

function sign(message: string) {
  return crypto
    .createHmac("sha256", process.env.ESEWA_SECRET_KEY!)
    .update(message)
    .digest("base64");
}

export function buildEsewaPayload(opts: {
  amount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}) {
  const { amount, transactionUuid, successUrl, failureUrl } = opts;
  const productCode = process.env.ESEWA_MERCHANT_CODE!;
  const fields = "total_amount,transaction_uuid,product_code";
  const signature = sign(
    `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${productCode}`
  );

  return {
    action: `${BASE}/api/epay/main/v2/form`,
    fields: {
      amount: String(amount),
      tax_amount: "0",
      total_amount: String(amount),
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: fields,
      signature,
    },
  };
}

export async function verifyEsewa(transactionUuid: string, amount: number) {
  const productCode = process.env.ESEWA_MERCHANT_CODE!;
  const url = `${BASE}/api/epay/transaction/status/?product_code=${productCode}&total_amount=${amount}&transaction_uuid=${transactionUuid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { paid: false as const };
  const data = (await res.json()) as { status?: string };
  return { paid: data.status === "COMPLETE" as const, raw: data };
}
