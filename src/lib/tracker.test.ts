import assert from "node:assert/strict";
import test from "node:test";
import { track, trackBatch } from "./tracker.ts";

const installBrowserGlobals = () => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: {
        getItem() {
          return null;
        },
        setItem() {
          throw new Error("storage blocked");
        },
      },
      localStorage: {
        getItem() {
          return null;
        },
        setItem() {
          throw new Error("storage blocked");
        },
      },
      location: {
        href: "https://example.test/checkout?eventId=event_1",
        pathname: "/checkout",
        search: "?eventId=event_1",
      },
      innerWidth: 390,
      innerHeight: 844,
    },
  });

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      title: "Checkout",
      referrer: "",
    },
  });

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      language: "en-IN",
      sendBeacon() {
        throw new Error("beacon blocked");
      },
    },
  });
};

test("track does not throw when browser storage is unavailable", () => {
  installBrowserGlobals();

  assert.doesNotThrow(() => {
    track("checkoutStarted", { eventId: "event_1" });
  });
});

test("trackBatch does not throw when browser storage is unavailable", () => {
  installBrowserGlobals();

  assert.doesNotThrow(() => {
    trackBatch([{ eventType: "checkoutStarted", eventId: "event_1" }]);
  });
});
