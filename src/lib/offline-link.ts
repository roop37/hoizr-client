import { gqlRequest } from "@/lib/graphql";

/**
 * Offline payment link resolver. Guest checkout was REMOVED (2026-06-22) — a
 * customer must be logged in to place ANY order. This module now only resolves
 * a host's offline payment-link short code for display; the actual payment runs
 * through the authed /checkout flow (login-gated), carrying offlineOrderId.
 */

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

