"use client";

import { useEffect, useState } from "react";
import {
  QrCode,
  X,
  ScanLine,
  Camera,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PAYMENT, SITE } from "@/lib/constants";
import { npr } from "@/lib/utils";

const steps = [
  { icon: ScanLine, text: "Open eSewa, Khalti or your bank app and scan the QR." },
  { icon: Camera, text: "Pay the first month, then take a screenshot of the receipt." },
  { icon: MessageCircle, text: "Send the screenshot to us on WhatsApp — we confirm within a few hours." },
];

/**
 * First-month payment is manual: the parent scans our Fonepay/eSewa QR, pays,
 * and sends the receipt on WhatsApp. No online gateway is involved, so nothing
 * is auto-charged — this panel only shows the QR and the how-to.
 */
export function PaymentPanel({
  amount,
  reference,
}: {
  amount?: number;
  reference: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  // Close on Escape and lock scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const waText = encodeURIComponent(
    `Hi ${SITE.name}, I've paid the first month for request #${reference.slice(0, 8)}` +
      (amount ? ` (${npr(amount)})` : "") +
      `. Here is my payment screenshot.`,
  );
  const waHref = `https://wa.me/${SITE.whatsapp}?text=${waText}`;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(PAYMENT.esewaId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the ID is visible on screen anyway */
    }
  }

  return (
    <>
      <Button variant="accent" onClick={() => setOpen(true)}>
        <QrCode className="h-4 w-4" aria-hidden /> Pay first month
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Pay the first month"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="animate-rise flex max-h-[90dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-3xl bg-card shadow-card sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">
                  Scan to pay the first month
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {amount ? (
                    <>
                      Amount:{" "}
                      <span className="font-semibold text-foreground">
                        {npr(amount)}
                      </span>
                    </>
                  ) : (
                    "We'll confirm the exact amount on our call."
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="px-6 py-6">
              {/* QR */}
              <div className="mx-auto flex max-w-xs flex-col items-center">
                <div className="grid aspect-square w-full max-w-[240px] place-items-center overflow-hidden rounded-2xl border border-border bg-background p-3">
                  {imgOk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={PAYMENT.qrImage}
                      alt={`${PAYMENT.payeeName} payment QR`}
                      className="h-full w-full object-contain"
                      onError={() => setImgOk(false)}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                      <QrCode className="h-12 w-12 opacity-40" aria-hidden />
                      <p className="text-xs">
                        Pay to the eSewa / Fonepay ID below, or ask us for the QR
                        on WhatsApp.
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-center text-sm font-semibold text-foreground">
                  {PAYMENT.payeeName}
                </p>

                {/* Fallback ID */}
                <button
                  type="button"
                  onClick={copyId}
                  className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {copied ? "Copied" : PAYMENT.esewaId}
                </button>
              </div>

              {/* Steps */}
              <ol className="mt-6 space-y-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <s.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="pt-1 text-sm leading-relaxed text-muted-foreground">
                      {s.text}
                    </span>
                  </li>
                ))}
              </ol>

              {/* WhatsApp confirm */}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-[15px] font-semibold text-white transition-all hover:brightness-105 active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Send receipt on WhatsApp
              </a>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
                You only pay after a demo you&apos;re happy with. {PAYMENT.bankNote}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
