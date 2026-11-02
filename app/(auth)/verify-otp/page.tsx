import type { Metadata } from "next";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Verify your number" };

/**
 * OTP entry screen. The actual send/verify is wired through Supabase Auth's
 * phone provider + the Send SMS hook (Edge Function `send-sms`). This is the
 * UI shell; the client handler is added when the SMS provider is live.
 */
export default function VerifyOtpPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Enter the code</h1>
      <p className="mt-1 text-sm text-ink-500">
        We sent a 6-digit code to your phone. It expires in a few minutes.
      </p>
      <form className="mt-8 space-y-5">
        <div>
          <Label>6-digit code</Label>
          <Input
            name="code"
            inputMode="numeric"
            maxLength={6}
            placeholder="● ● ● ● ● ●"
            className="text-center text-2xl tracking-[0.5em]"
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Verify
        </Button>
        <button
          type="button"
          className="w-full text-center text-sm font-medium text-brand-700 hover:underline"
        >
          Resend code
        </button>
      </form>
    </div>
  );
}
