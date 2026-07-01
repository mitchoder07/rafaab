// Paystack integration helpers (server-side only)
// Docs: https://paystack.com/docs/payments/accept-payments

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackInitResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string; // success | failed | abandoned | pending
    reference: string;
    amount: number; // in kobo (smallest currency unit)
    currency: string;
    gateway_response: string;
    paid_at: string;
    channel: string;
    customer: { email: string; name?: string };
    metadata?: { custom_fields?: { display_name: string; value: string }[] };
  };
};

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key || key.startsWith("sk_test_xxxxx")) {
    throw new Error(
      "Paystack secret key not configured. Add PAYSTACK_SECRET_KEY to your .env file (get free test keys at https://dashboard.paystack.com/#/settings/keys)"
    );
  }
  return key;
}

export function isPaystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY;
  return !!key && !key.startsWith("sk_test_xxxxx");
}

// Initialize a transaction. Returns the authorization URL to redirect the user to.
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in Naira (will be converted to kobo)
  reference: string;
  callback_url: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  const secretKey = getSecretKey();
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount * 100), // Naira → kobo
      reference: params.reference,
      callback_url: params.callback_url,
      currency: "NGN",
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data.message || "Failed to initialize Paystack transaction");
  }
  return data as PaystackInitResponse;
}

// Verify a transaction by reference. Confirms the payment actually happened.
export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const secretKey = getSecretKey();
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Failed to verify Paystack transaction");
  }
  return data as PaystackVerifyResponse;
}

// Generate a unique Paystack reference
export function generateReference(orderNumber: string): string {
  return `${orderNumber}-${Date.now().toString(36).toUpperCase()}`;
}
