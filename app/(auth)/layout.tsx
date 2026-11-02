import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="bg-dotted absolute inset-0 opacity-10" aria-hidden />
        <Logo className="relative [&_span:last-child]:text-primary-foreground" />
        <div className="relative max-w-sm">
          <p className="text-2xl font-bold leading-snug">
            &ldquo;A verified tutor, not a Facebook gamble.&rdquo;
          </p>
          <p className="mt-4 text-primary-foreground/80">
            Bright Path matches parents with verified, background-checked home
            tutors across Nepal.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/70">
          Verified tutors · Free demo · Pay only when you confirm.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
