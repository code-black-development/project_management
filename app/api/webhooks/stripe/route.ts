import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const stripeCustomerId = session.customer as string;
        const stripeSubscriptionId = session.subscription as string;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error("Missing metadata in checkout.session.completed", session.metadata);
          break;
        }

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            stripeCustomerId,
            stripeSubscriptionId,
            status: "ACTIVE",
            planId,
          },
          create: {
            userId,
            stripeCustomerId,
            stripeSubscriptionId,
            status: "ACTIVE",
            planId,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = stripeSubscription.customer as string;
        const stripePriceId = stripeSubscription.items.data[0]?.price?.id;

        let planId: string | undefined;
        if (stripePriceId) {
          const plan = await prisma.plan.findUnique({ where: { stripePriceId } });
          planId = plan?.id;
        }

        const statusMap: Record<string, string> = {
          active: "ACTIVE",
          past_due: "PAST_DUE",
          canceled: "CANCELED",
          unpaid: "UNPAID",
          trialing: "TRIALING",
        };
        const status = statusMap[stripeSubscription.status] ?? "ACTIVE";

        // In API 2026-04-22.dahlia, current_period_end is removed from Subscription.
        // billing_cycle_anchor is the closest proxy for cycle tracking.
        // We store what we can from available fields.
        await prisma.subscription.updateMany({
          where: { stripeCustomerId },
          data: {
            status: status as "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "TRIALING",
            ...(planId ? { planId } : {}),
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const stripeSubscriptionId = stripeSubscription.id;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId },
          data: { status: "CANCELED" },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;

        await prisma.subscription.updateMany({
          where: { stripeCustomerId },
          data: { status: "PAST_DUE" },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;

        // In API 2026-04-22.dahlia, subscription is accessed via invoice.parent.subscription_details.subscription
        const parentSubscription =
          invoice.parent?.type === "subscription_details"
            ? invoice.parent.subscription_details?.subscription
            : undefined;
        const stripeSubscriptionId =
          typeof parentSubscription === "string"
            ? parentSubscription
            : parentSubscription?.id;

        // Attempt to retrieve the subscription to get period end info
        let currentPeriodEnd: Date | undefined;
        if (stripeSubscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            // billing_cycle_anchor is available; use next invoice date as proxy if needed
            // For now just mark active without period end since the field is removed in this API version
            void sub;
          } catch (e) {
            console.error("Failed to retrieve subscription:", e);
          }
        }

        await prisma.subscription.updateMany({
          where: { stripeCustomerId },
          data: {
            status: "ACTIVE",
            ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          },
        });
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
