"use client";

import { useActionState, useState } from "react";
import { startOnlinePayment } from "@/lib/public-actions";
import { FormError } from "./Field";

export function PayForm({ reference, token, balance, minimum }: { reference: string; token: string; balance: string; minimum: string }) {
  const [state, action, pending] = useActionState(startOnlinePayment, undefined);
  const [amount, setAmount] = useState(state?.values?.amount ?? "");
  const fmt = (v: string) => "₦" + Number(v).toLocaleString("en-NG", { maximumFractionDigits: 2 });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ref" value={reference} />
      <input type="hidden" name="t" value={token} />
      <FormError message={state?.error} />
      <div>
        <label htmlFor="amount" className="label">Amount to pay now (₦)</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="amount"
            name="amount"
            inputMode="decimal"
            className="input max-w-52"
            placeholder="e.g. 500000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="button" className="btn-ghost btn-sm" onClick={() => setAmount(balance)}>Pay full balance</button>
        </div>
        {state?.fieldErrors?.amount ? (
          <p className="mt-1 text-xs text-red-700" role="alert">{state.fieldErrors.amount}</p>
        ) : (
          <p className="hint">Pay any amount from {fmt(minimum)} up to your balance of {fmt(balance)}. You can pay in as many instalments as you need.</p>
        )}
      </div>
      <button className="btn-primary" disabled={pending}>{pending ? "Connecting to Paystack…" : "Pay securely with Paystack"}</button>
      <p className="text-xs text-stone">You will be taken to Paystack to pay by card, bank transfer or USSD. Your payment is recorded and a receipt issued once Paystack confirms it.</p>
    </form>
  );
}
