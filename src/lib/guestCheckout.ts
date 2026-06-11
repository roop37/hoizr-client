import { gqlRequest } from "@/lib/graphql";

/**
 * Guest checkout — a not-logged-in buyer places an order with just their
 * contact details + the tickets they selected. Calls the PUBLIC
 * createGuestOrder mutation (no session). The server resolves/creates the
 * customer by phone, runs the normal order flow, and returns a Razorpay
 * payload for paid events (or no checkout for free ones).
 */

export type GuestCheckoutInput = {
  eventId: string;
  tickets: { ticketId: string; quantity: number }[];
  extras?: { extraId: string; quantity: number }[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notifyMe: boolean;
  /** Set when the order came from a host's offline payment link. */
  offlineOrderId?: string;
};

export type OfflinePaymentLinkView = {
  offlineOrderId: string;
  eventId: string;
  eventTitle?: string | null;
  eventFlyer?: string | null;
  eventSlug?: string | null;
  lines: {
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    isExtra: boolean;
  }[];
  amountTotal: number;
  customerFirstName?: string | null;
  customerLastName?: string | null;
  customerEmail?: string | null;
  customerPhone: string;
  alreadyPaid: boolean;
  expired: boolean;
};

const OFFLINE_PAYMENT_LINK = `
  query OfflinePaymentLink($shortCode: String!) {
    offlinePaymentLink(shortCode: $shortCode) {
      offlineOrderId eventId eventTitle eventFlyer eventSlug
      lines { itemId name quantity unitPrice isExtra }
      amountTotal customerFirstName customerLastName customerEmail customerPhone
      alreadyPaid expired
    }
  }
`;

export const fetchOfflinePaymentLink = async (
  shortCode: string
): Promise<OfflinePaymentLinkView> => {
  const data = await gqlRequest<{ offlinePaymentLink: OfflinePaymentLinkView }>(
    OFFLINE_PAYMENT_LINK,
    { shortCode }
  );
  return data.offlinePaymentLink;
};

export type GuestCheckoutResult = {
  order: { _id: string; totalAmount: number };
  checkout?: {
    razorpayOrderId: string;
    razorpayKeyId: string;
    amount: number;
    currency: string;
    orderId: string;
  } | null;
  accountFound: boolean;
  accountEmail?: string | null;
};

const CREATE_GUEST_ORDER = `
  mutation CreateGuestOrder($input: GuestOrderInput!) {
    createGuestOrder(input: $input) {
      order { _id totalAmount }
      checkout { razorpayOrderId razorpayKeyId amount currency orderId }
      accountFound
      accountEmail
    }
  }
`;

export type GuestOrderApiInput = GuestCheckoutInput;

export const createGuestOrder = async (
  input: GuestCheckoutInput
): Promise<GuestCheckoutResult> => {
  const data = await gqlRequest<{ createGuestOrder: GuestCheckoutResult }>(
    CREATE_GUEST_ORDER,
    { input }
  );
  return data.createGuestOrder;
};

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export const loadRazorpay = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT_SRC}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(Boolean(window.Razorpay));
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
