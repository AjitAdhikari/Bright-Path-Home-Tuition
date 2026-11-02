import { cn } from "@/lib/utils";

const inputBase =
  "w-full min-h-12 rounded-lg border border-input bg-card px-3 text-base text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:ring-2 focus:ring-ring/40 focus:outline-none aria-[invalid=true]:border-2 aria-[invalid=true]:border-destructive";

export function Label({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 block text-sm font-bold text-foreground">
      {children}
      {hint && (
        <span className="ml-1 font-normal text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(inputBase, "min-h-28 resize-y", className)} {...rest} />
  );
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, "appearance-none pr-10", className)} {...rest}>
      {children}
    </select>
  );
}
