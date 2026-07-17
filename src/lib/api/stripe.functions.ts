import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";

// Helper to get Stripe instance if secret key is present
function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey === "YOUR_STRIPE_SECRET_KEY" || secretKey.startsWith("sk_test_mock")) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-01-27.acacia" as any, // Use standard api version
  });
}

// 1. Create Checkout Session
export const createStripeSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      cart: z.array(
        z.object({
          name: z.string(),
          price: z.number(),
          qty: z.number(),
          image: z.string().optional().nullable(),
        })
      ),
      subtotal: z.number(),
      deliveryFee: z.number(),
      orderType: z.enum(["dine-in", "takeaway", "delivery"]),
      origin: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const stripe = getStripeInstance();
    const totalAmount = data.subtotal + data.deliveryFee;

    console.log(`[Stripe Server] Creating session for amount: ฿${totalAmount}`);

    // If Stripe is not configured, return a mock success redirect for Sandbox Mode
    if (!stripe) {
      console.warn("[Stripe Server] Stripe secret key not configured. Running in SANDBOX MODE.");
      const mockSessionId = `mock_stripe_sess_${Math.random().toString(36).substring(2, 15)}`;
      const mockSuccessUrl = `${data.origin}/customer?payment_success=true&session_id=${mockSessionId}`;
      return {
        url: mockSuccessUrl,
        isSandbox: true,
      };
    }

    try {
      // Build line items for Stripe Checkout
      const lineItems = data.cart.map((item) => ({
        price_data: {
          currency: "thb",
          product_data: {
            name: item.name,
            ...(item.image ? { images: [item.image.startsWith("/") ? `${data.origin}${item.image}` : item.image] } : {}),
          },
          unit_amount: Math.round(item.price * 100), // Stripe expects satangs for THB
        },
        quantity: item.qty,
      }));

      // Add delivery fee as a line item if applicable
      if (data.deliveryFee > 0) {
        lineItems.push({
          price_data: {
            currency: "thb",
            product_data: {
              name: "ค่าจัดส่ง (Delivery Fee)",
            },
            unit_amount: Math.round(data.deliveryFee * 100),
          },
          quantity: 1,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "promptpay"], // Card & PromptPay both supported in Thailand
        line_items: lineItems,
        mode: "payment",
        success_url: `${data.origin}/customer?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.origin}/customer?payment_cancelled=true`,
        metadata: {
          orderType: data.orderType,
        },
      });

      return {
        url: session.url,
        isSandbox: false,
      };
    } catch (error: any) {
      console.error("[Stripe Server] Error creating Stripe session:", error);
      throw new Error(error.message || "Failed to create Stripe session");
    }
  });

// 2. Verify Checkout Session
export const verifyStripeSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      sessionId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    console.log(`[Stripe Server] Verifying session: ${data.sessionId}`);

    // If it's a mock session, immediately approve
    if (data.sessionId.startsWith("mock_stripe_sess_")) {
      return {
        success: true,
        isSandbox: true,
        message: "Sandbox payment verified successfully",
      };
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      // If Stripe was unconfigured but somehow got a non-mock session ID, fail or treat as sandbox
      return {
        success: true,
        isSandbox: true,
        message: "Stripe credentials missing; Sandbox auto-approval",
      };
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(data.sessionId);
      
      if (session.payment_status === "paid") {
        return {
          success: true,
          isSandbox: false,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          paymentMethodTypes: session.payment_method_types,
        };
      } else {
        return {
          success: false,
          isSandbox: false,
          message: `Payment status is: ${session.payment_status}`,
        };
      }
    } catch (error: any) {
      console.error("[Stripe Server] Error verifying Stripe session:", error);
      return {
        success: false,
        isSandbox: false,
        message: error.message || "Failed to retrieve checkout session",
      };
    }
  });