import { auth } from "@/auth";
import prisma from "@/prisma/prisma";
import { redirect } from "next/navigation";
import { CreditCardIcon, CheckIcon } from "lucide-react";
import BillingPortalButton from "./_components/billing-portal-button";
import CheckoutButton from "./_components/checkout-button";

export const dynamic = "force-dynamic";

const statusBadgeClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  TRIALING: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PAST_DUE: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  CANCELED: "bg-red-500/10 text-red-700 dark:text-red-400",
  UNPAID: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active",
  TRIALING: "Trialing",
  PAST_DUE: "Past due",
  CANCELED: "Canceled",
  UNPAID: "Unpaid",
};

const BillingPage = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const userId = session.user.id;

  const [subscription, plans, workspaceCount] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } }),
    prisma.workspace.count({ where: { user: userId } }),
  ]);

  const currentPlanId = subscription?.planId ?? null;
  const status = subscription?.status ?? "ACTIVE";
  const hasStripeCustomer = !!subscription?.stripeCustomerId;

  return (
    <div className="flex flex-col gap-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan and billing details.
        </p>
      </div>

      {/* Current plan summary */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <p className="text-sm font-semibold text-foreground">Current plan</p>
          {hasStripeCustomer && <BillingPortalButton />}
        </div>

        <div className="flex items-center gap-x-4">
          <div className="size-10 flex items-center justify-center rounded-lg bg-muted border border-border shrink-0">
            <CreditCardIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-y-0.5">
            <div className="flex items-center gap-x-2">
              <span className="text-sm font-medium text-foreground">
                {subscription?.plan?.name ?? "No plan"}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClasses[status] ?? statusBadgeClasses.ACTIVE}`}
              >
                {statusLabel[status] ?? status}
              </span>
            </div>
            {subscription?.plan && (
              <p className="text-xs text-muted-foreground">
                {subscription.plan.priceMonthly === 0
                  ? "Free"
                  : `$${subscription.plan.priceMonthly}/month`}
              </p>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="mt-4 flex flex-col gap-y-2 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Usage
          </p>
          <div className="flex items-center gap-x-6">
            <div className="flex flex-col gap-y-0.5">
              <span className="text-sm font-medium text-foreground">
                {workspaceCount}{" "}
                <span className="text-muted-foreground font-normal">
                  /{" "}
                  {subscription?.plan?.maxWorkspaces === -1
                    ? "unlimited"
                    : subscription?.plan?.maxWorkspaces ?? "—"}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">workspaces</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-col gap-y-0.5">
              <span className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground font-normal">Up to </span>
                {subscription?.plan?.maxMembers === -1
                  ? "unlimited"
                  : subscription?.plan?.maxMembers ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">members per workspace</span>
            </div>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground">
              {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="bg-card border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-foreground border-b border-border pb-4 mb-4">
          Plans
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isFree = plan.priceMonthly === 0;

            const featureLines = [
              plan.maxWorkspaces === -1
                ? "Unlimited workspaces"
                : `${plan.maxWorkspaces} workspace${plan.maxWorkspaces !== 1 ? "s" : ""}`,
              plan.maxMembers === -1
                ? "Unlimited members per workspace"
                : `${plan.maxMembers} member${plan.maxMembers !== 1 ? "s" : ""} per workspace`,
            ];

            return (
              <div
                key={plan.id}
                className={`bg-muted border rounded-xl p-4 flex flex-col gap-y-4 ${isCurrent ? "border-primary/40" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                  {isCurrent && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Current plan
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-x-1">
                  {isFree ? (
                    <span className="text-2xl font-semibold text-foreground">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-semibold text-foreground">
                        ${plan.priceMonthly}
                      </span>
                      <span className="text-xs text-muted-foreground">/month</span>
                    </>
                  )}
                </div>

                <ul className="flex flex-col gap-y-1.5">
                  {featureLines.map((line) => (
                    <li key={line} className="flex items-start gap-x-2">
                      <CheckIcon className="size-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground">{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full text-sm font-medium py-2 px-3 rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed"
                    >
                      Current plan
                    </button>
                  ) : isFree ? (
                    <div className="flex flex-col gap-y-1.5">
                      <button
                        disabled
                        className="w-full text-sm font-medium py-2 px-3 rounded-lg bg-muted border border-border text-muted-foreground cursor-not-allowed"
                      >
                        Downgrade to free
                      </button>
                      <p className="text-xs text-muted-foreground text-center">
                        Excess workspaces may be frozen.
                      </p>
                    </div>
                  ) : (
                    <CheckoutButton planName={plan.name} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
