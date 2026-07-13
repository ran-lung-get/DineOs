import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-01-27.acacia" as any,
    })
  : null;

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripe) {
          console.warn("[Stripe Webhook] Stripe secret key not configured. Webhook ignored.");
          return new Response(JSON.stringify({ error: "Stripe not configured on server" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!signature || !webhookSecret) {
          console.error("[Stripe Webhook] Missing stripe-signature header or STRIPE_WEBHOOK_SECRET env variable.");
          return new Response(JSON.stringify({ error: "Missing signature or webhook secret" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const rawBody = await request.text();
          const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

          console.log(`[Stripe Webhook] Verified event: ${event.type}`);

          // Handle checkout session completed
          if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`[Stripe Webhook] Checkout completed for session ID: ${session.id}`);
            console.log(`[Stripe Webhook] Payment Status: ${session.payment_status}`);
          }

          return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
          return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
