import { MailCheckIcon } from "lucide-react";
import Link from "next/link";

interface VerifyEmailProps {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
}

const VerifyEmailPage = async ({ searchParams }: VerifyEmailProps) => {
  const { email } = await searchParams;

  return (
    <div className="w-full md:w-[487px] overflow-hidden rounded-xl border border-border bg-card shadow-sm dark:shadow-none">
      <div className="border-b border-border px-6 py-5 text-center">
        <h1 className="text-base font-semibold text-foreground">
          Check your email
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your address to continue
        </p>
      </div>
      <div className="px-6 py-8 flex flex-col items-center gap-y-4 text-center">
        <div className="flex items-center justify-center size-14 rounded-full bg-muted border border-border">
          <MailCheckIcon className="size-7 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-y-1">
          <p className="text-sm font-medium text-foreground">
            We&apos;ve sent a verification link to:
          </p>
          {email ? (
            <p className="text-sm text-muted-foreground font-medium">{email}</p>
          ) : (
            <p className="text-sm text-muted-foreground">your email address</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          Click the link in the email to verify your account. The link expires
          in 24 hours.
        </p>
        <p className="text-xs text-muted-foreground">
          Already verified?{" "}
          <Link
            href="/sign-in"
            className="text-foreground underline hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
