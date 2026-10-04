// A ₹0 order is a free RSVP / fully-discounted ticket and must read "Free",
// never "₹0.00" — while a ₹0 fee/tax/subtotal ROW must keep "₹0.00" so the
// breakdown columns stay aligned. This test pins both halves of that split,
// because "fixing" either one in isolation reintroduces the bug.
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");

const read = (relativePath) =>
  fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");

// ── helper semantics ────────────────────────────────────────────────────────
const format = read("src/lib/format.ts");
assert.match(
  format,
  /export const rupeeOrFree = \(value: number\) =>\s*Number\(value\) > 0 \? rupee\(value\) : "Free";/,
  'rupeeOrFree must be `> 0` — `>= 0` would print "Free" for every amount',
);
assert.ok(
  !/rupee = [\s\S]{0,200}"Free"/.test(format),
  "rupee() itself must never return Free — ₹0 fee/tax rows depend on ₹0.00",
);

// ── customer-facing ORDER TOTALS + line items use rupeeOrFree ───────────────
for (const [relativePath, expected] of [
  // Orders list card total (the reported "₹0.00" on a free RSVP).
  ["src/app/orders/OrdersClient.tsx", ["rupeeOrFree(order.totalAmount)"]],
  // Same order rendered twice on the detail page (main + ticket stub).
  [
    "src/app/orders/[orderId]/OrderDetailClient.tsx",
    [
      "rupeeOrFree(order.totalAmount)",
      "rupeeOrFree(t.totalPrice)",
      "rupeeOrFree(e.totalPrice)",
    ],
  ],
  ["src/components/hoizr-ui/HCartBar.tsx", ["rupeeOrFree(cart.totalAmount)"]],
  ["src/app/checkout/CheckoutClient.tsx", ["rupeeOrFree(line.totalPrice)"]],
]) {
  const source = read(relativePath);
  for (const call of expected) {
    assert.ok(
      source.includes(call),
      `${relativePath} should render ${call} so a free order reads "Free"`,
    );
  }
}

// ── fee / tax / subtotal rows deliberately KEEP rupee() ─────────────────────
const orderDetail = read("src/app/orders/[orderId]/OrderDetailClient.tsx");
for (const field of [
  "order.subtotal",
  "order.platformFee",
  "order.platformFeeGst",
  "order.taxes",
]) {
  assert.ok(
    orderDetail.includes(`rupee(${field})`),
    `${field} must stay rupee() — a ₹0 fee row saying "Free" is wrong`,
  );
}

console.log("free-order money display: OK");
