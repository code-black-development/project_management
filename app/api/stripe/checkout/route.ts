import { auth } from "@/auth";
import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://app.localhost:3000";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
  });

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { planName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { planName } = body;
  if (!planName) {
    return NextResponse.json({ error: "planName is required" }, { status: 400 });
  }

  // Look up plan
  const plan = await prisma.plan.findUnique({ where: { name: planName } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (!plan.stripePriceId) {
    return NextResponse.json({ error: "Plan has no Stripe price configured" }, { status: 400 });
  }

  // Look up or create subscription record and Stripe customer
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let stripeCustomerId = subscription?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
    });
    stripeCustomerId = customer.id;

    // Save customer ID to subscription
    if (subscription) {
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId },
      });
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${appOrigin}/billing?success=1`,
    cancel_url: `${appOrigin}/billing`,
    metadata: {
      userId,
      planId: plan.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
