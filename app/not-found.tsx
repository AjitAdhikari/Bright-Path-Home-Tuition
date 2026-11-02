import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-5 text-center">
      <div>
        <Logo className="justify-center" />
        <p className="mt-10 text-7xl font-black text-brand-200">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">
          This page took a wrong turn
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-500">
          The bridge doesn&apos;t reach here. Let&apos;s get you back to solid ground.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Go home</ButtonLink>
          <ButtonLink href="/find-tutor" variant="outline">Find a tutor</ButtonLink>
        </div>
      </div>
    </div>
  );
}
