import type { CartResponse } from "@/types/order";

export type CartMutationInput = {
  eventId: string;
  tickets: Array<{ ticketId: string; quantity: number }>;
  extras: Array<{ extraId: string; quantity: number }>;
};

export type GuestInfoDraft = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export const buildCartInput = (cart: CartResponse): CartMutationInput => ({
  eventId: cart.eventId,
  tickets: cart.tickets
    .filter((line) => line.quantity > 0)
    .map((line) => ({ ticketId: line.ticketId, quantity: line.quantity })),
  extras: cart.extras
    .filter((line) => line.quantity > 0)
    .map((line) => ({ extraId: line.extraId, quantity: line.quantity })),
});

export const buildAdjustedCartInput = (
  cart: CartResponse,
  kind: "ticket" | "extra",
  lineId: string,
  delta: number
): CartMutationInput => {
  const input = buildCartInput(cart);

  if (kind === "ticket") {
    const nextTickets = input.tickets
      .map((line) =>
        line.ticketId === lineId
          ? { ...line, quantity: Math.max(0, line.quantity + delta) }
          : line
      )
      .filter((line) => line.quantity > 0);

    return {
      ...input,
      tickets: nextTickets.length ? nextTickets : input.tickets,
    };
  }

  return {
    ...input,
    extras: input.extras
      .map((line) =>
        line.extraId === lineId
          ? { ...line, quantity: Math.max(0, line.quantity + delta) }
          : line
      )
      .filter((line) => line.quantity > 0),
  };
};

export const isGuestInfoComplete = (draft: GuestInfoDraft): boolean => {
  const hasName = Boolean(
    draft.firstName?.trim() || draft.lastName?.trim()
  );
  const email = draft.email?.trim() ?? "";
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return hasName && hasValidEmail && Boolean(draft.phone?.trim());
};
