// Supabase Edge Function wired to the Auth "Send SMS" hook, and reused for
// lead/demo/payment alerts. Swap the stub for your Nepali SMS provider's API.
//
// Deploy:  supabase functions deploy send-sms
// Secret:  supabase secrets set SMS_PROVIDER_API_KEY=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface SmsPayload {
  phone: string;
  message: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: SmsPayload;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { phone, message } = body;
  if (!phone || !message) {
    return new Response("phone and message required", { status: 400 });
  }

  const apiKey = Deno.env.get("SMS_PROVIDER_API_KEY");
  if (!apiKey) {
    console.error("SMS_PROVIDER_API_KEY not set");
    return new Response("Not configured", { status: 500 });
  }

  // TODO: replace with your provider's real endpoint and body shape.
  // const res = await fetch("https://api.sms-provider.com.np/v1/send", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  //   body: JSON.stringify({ to: phone, text: message }),
  // });

  console.log(`[send-sms] → ${phone}: ${message}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
