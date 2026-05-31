import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import type { CartResponse } from "@/types/order";
import {
  activeCartFromCartResponse,
  activeCartSelections,
  readActiveCart,
  writeActiveCart,
} from "./active-cart.ts";

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
    grossAmount: 1300,
    applicationFee: 65,
    applicationFeePercent: 5,
    platformFeeGst: 11.7,
    taxes: 0,
    taxesPercent: 0,
    totalAmount: 1376.7,
  },
  reservedAt: "2026-05-16T09:00:00.000Z",
  expiresAt: "2099-05-16T09:13:00.000Z",
};

const installWindow = () => {
  const storage = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    dispatchEvent: () => true,
  };
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;

    constructor(type: string) {
      this.type = type;
    }
  };
};

beforeEach(() => {
  installWindow();
});

test("activeCartFromCartResponse stores selected ticket and extra quantities", () => {
  assert.deepEqual(
    activeCartFromCartResponse(cart, {
      eventSlug: "test-event",
      eventTitle: "Test Event",
      eventImage: "https://example.com/flyer.jpg",
    }),
    {
      eventId: "event_1",
      eventSlug: "test-event",
      eventTitle: "Test Event",
      eventImage: "https://example.com/flyer.jpg",
      totalAmount: 1376.7,
      expiresAt: "2099-05-16T09:13:00.000Z",
      tickets: [{ ticketId: "ticket_a", quantity: 2 }],
      extras: [{ extraId: "extra_a", quantity: 1 }],
    }
  );
});

test("readActiveCart returns persisted selections for event detail restore", () => {
  writeActiveCart(activeCartFromCartResponse(cart));

  const persisted = readActiveCart();

  assert.deepEqual(activeCartSelections(persisted), {
    tickets: { ticket_a: 2 },
    extras: { extra_a: 1 },
  });
});
