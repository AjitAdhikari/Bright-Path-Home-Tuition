import type { Metadata } from "next";
import { Card, Badge } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About & contact",
  description:
    "Bright Path is a trusted bridge between parents and verified home tutors in Nepal. Here's why we exist and how to reach us.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Badge tone="brand">About Bright Path</Badge>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        Finding a good tutor shouldn&apos;t be a gamble
      </h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-600">
        <p>
          Today most parents in Nepal find tutors through Facebook posts,
          WhatsApp groups and word of mouth. It works sometimes — but you never
          really know who is walking into your home to teach your child.
        </p>
        <p>
          <strong className="text-ink-900">Bright Path</strong> exists to fix
          that. We verify every tutor&apos;s
          ID and certificates, interview them, and only then let them meet
          parents. We call you before we match, arrange a free demo, and you
          pay only when you&apos;re happy.
        </p>
        <p>
          Our product is trust and speed. That&apos;s the whole business.
        </p>
      </div>

      <Card className="mt-10">
        <h2 className="text-lg font-bold text-ink-900">Get in touch</h2>
        <p className="mt-1 text-sm text-ink-600">
          Questions, feedback or a complaint about a tutor? We want to hear it —
          a serious complaint means immediate removal, every time.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-400"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-green-700">💬</span>
            <div>
              <p className="text-sm font-semibold text-ink-900">WhatsApp</p>
              <p className="text-sm text-ink-500">+{SITE.whatsapp}</p>
            </div>
          </a>
          <a
            href="mailto:hello@setu.com.np"
            className="flex items-center gap-3 rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-400"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-brand-700">✉️</span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Email</p>
              <p className="text-sm text-ink-500">hello@setu.com.np</p>
            </div>
          </a>
        </div>
      </Card>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/find-tutor">Find a tutor</ButtonLink>
        <ButtonLink href="/become-tutor" variant="outline">Become a tutor</ButtonLink>
      </div>
    </div>
  );
}
