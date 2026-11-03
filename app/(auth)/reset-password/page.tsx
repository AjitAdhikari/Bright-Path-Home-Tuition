import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Set your password" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Set your password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome to Bright Path. Choose a password to finish setting up your
        tutor account.
      </p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
