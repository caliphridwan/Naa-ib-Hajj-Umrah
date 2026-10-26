import { finalizeOnlinePayment } from "@/lib/online-payments";
import { validWebhookSignature } from "@/lib/paystack";

// Configure in Paystack dashboard → Settings → API Keys & Webhooks:
//   https://YOUR-DOMAIN/api/paystack/webhook
// Records payments even if the customer closes the browser before returning.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) return new Response("Invalid signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (event.event === "charge.success" && event.data?.reference) {
    try {
      await finalizeOnlinePayment(event.data.reference);
    } catch (e) {
      console.error("Paystack webhook processing failed", e);
      return new Response("Retry", { status: 500 }); // Paystack retries
    }
  }
  return new Response("OK");
}
