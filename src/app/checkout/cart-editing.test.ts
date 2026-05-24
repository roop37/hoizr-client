import assert from "node:assert/strict";
import test from "node:test";
import type { CartResponse } from "@/types/order";
import {
  buildAdjustedCartInput,
  buildCartInput,
  isGuestInfoComplete,
} from "./cart-editing.ts";

const cart: CartResponse = {
  eventId: "event_1",
  tickets: [
    {
      ticketId: "ticket_a",
      ticketName: "General",
      quantity: 2,
      unitPrice: 500,
      totalPrice: 1000,
    },
    {
      ticketId: "ticket_b",
      ticketName: "VIP",
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
    },
  ],
  extras: [
    {
      extraId: "extra_a",
      extraName: "T-shirt",
      quantity: 1,
      unitPrice: 300,
      totalPrice: 300,
    },
  ],
  pricing: {
    grossAmount: 2300,
    applicationFee: 115,
    applicationFeePercent: 5,
    platformFeeGst: 20.7,
    taxes: 0,
    taxesPercent: 0,
    totalAmount: 2435.7,
  },
  reservedAt: "2026-05-16T09:00:00.000Z",
  expiresAt: "2026-05-16T09:13:00.000Z",
};

test("buildCartInput preserves ticket and extra quantities from the cart", () => {
  assert.deepEqual(buildCartInput(cart), {
    eventId: "event_1",
    tickets: [
      { ticketId: "ticket_a", quantity: 2 },
      { ticketId: "ticket_b", quantity: 1 },
    ],
    extras: [{ extraId: "extra_a", quantity: 1 }],
  });
});

test("buildAdjustedCartInput increments and decrements existing cart lines", () => {
  assert.deepEqual(buildAdjustedCartInput(cart, "ticket", "ticket_a", 1), {
    eventId: "event_1",
    tickets: [
      { ticketId: "ticket_a", quantity: 3 },
      { ticketId: "ticket_b", quantity: 1 },
    ],
    extras: [{ extraId: "extra_a", quantity: 1 }],
  });

  assert.deepEqual(buildAdjustedCartInput(cart, "extra", "extra_a", -1), {
    eventId: "event_1",
    tickets: [
      { ticketId: "ticket_a", quantity: 2 },
      { ticketId: "ticket_b", quantity: 1 },
    ],
    extras: [],
  });
});

test("buildAdjustedCartInput refuses to remove the final ticket from checkout", () => {
  const singleTicketCart: CartResponse = {
    ...cart,
    tickets: [cart.tickets[1]],
    extras: [],
  };

  assert.deepEqual(
    buildAdjustedCartInput(singleTicketCart, "ticket", "ticket_b", -1),
    {
      eventId: "event_1",
      tickets: [{ ticketId: "ticket_b", quantity: 1 }],
      extras: [],
    }
  );
});

test("isGuestInfoComplete requires a name and valid email in addition to phone", () => {
  assert.equal(
    isGuestInfoComplete({
      firstName: "Asha",
      lastName: "",
      email: "asha@example.com",
      phone: "+919999999999",
    }),
    true
  );
  assert.equal(
    isGuestInfoComplete({
      firstName: "",
      email: "asha@example.com",
      phone: "+919999999999",
    }),
    false
  );
  assert.equal(
    isGuestInfoComplete({
      firstName: "Asha",
      email: "not-an-email",
      phone: "+919999999999",
    }),
    false
  );
});
