import assert from "node:assert/strict";
import test from "node:test";

test("keeps Swiggy loading, failure, connect, reconnect, and connected actions distinct", async () => {
  const module = await import("./swiggy-connection-state.ts").catch(() => ({
    getSwiggyConnectionView: undefined,
  }));

  assert.equal(
    typeof module.getSwiggyConnectionView,
    "function",
    "the Swiggy connection state mapper must be implemented"
  );

  const cases = [
    { snapshot: null, failed: false, want: "loading" },
    { snapshot: null, failed: true, want: "error" },
    {
      snapshot: { connected: false, status: null },
      failed: false,
      want: "connect",
    },
    {
      snapshot: { connected: false, status: "EXPIRED" },
      failed: false,
      want: "reconnect",
    },
    {
      snapshot: { connected: false, status: "REVOKED" },
      failed: false,
      want: "reconnect",
    },
    {
      snapshot: { connected: false, status: "CONNECTED" },
      failed: false,
      want: "reconnect",
    },
    {
      snapshot: { connected: true, status: "CONNECTED" },
      failed: false,
      want: "connected",
    },
  ] as const;

  for (const { snapshot, failed, want } of cases) {
    assert.equal(module.getSwiggyConnectionView!(snapshot, failed), want);
  }
});
