export type CartTicketLine = {
  ticketId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type CartExtraLine = {
  extraId: string;
  extraName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type CartPricing = {
  grossAmount: number;
  applicationFee: number;
  applicationFeePercent: number;
  platformFeeGst: number;
  taxes: number;
  taxesPercent: number;
  totalAmount: number;
};

export type CartResponse = {
  eventId: string;
  tickets: CartTicketLine[];
  extras: CartExtraLine[];
  pricing: CartPricing;
  reservedAt: string;
  expiresAt: string;
};

export type OrderTicketItem = {
  ticketTypeId: string;
  ticketName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderExtraItem = {
  extraId: string;
  extraName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

/**
 * Runtime values match what the GraphQL schema emits — TypeGraphQL
 * serialises the enum *key* (not the TS-side value), so the customer-
 * server sends `"PAYMENT_SUCCESS"` over the wire even though the
 * hoizr-shared enum has `PAYMENT_SUCCESS = "PaymentSuccess"` in its
 * declaration. This used to be PascalCase here, which made every
 * status comparison silently false (QR never showed, badge label fell
 * through to default). Keep this union in sync with the codegen enum
 * in generated/graphql.ts.
 */
export type OrderStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "CHECKED_IN"
  | "CANCELLED"
  | "REFUNDED"
  | "SUPERSEDED";

export type CustomerOrderView = {
  _id: string;
  eventId: string;
  tickets: OrderTicketItem[];
  extras?: OrderExtraItem[];
  subtotal: number;
  platformFee: number;
  applicationFeePercent: number;
  platformFeeGst: number;
  taxes: number;
  taxesPercent: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  qrCodeData?: string;
  checkedIn: boolean;
  reservedAt: string;
  createdAt?: string;
  refundRequestStatus?: string;
  refundRequestedAt?: string;
  refundRequestReason?: string;
};

export type RazorpayCheckoutPayload = {
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  orderId: string;
};

export type CreateOrderResponse = {
  order: CustomerOrderView;
  checkout?: RazorpayCheckoutPayload;
};

export type ArtistMerchOrderStatus =
  | "PAYMENT_PENDING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "FULFILLED";

export type CustomerMerchOrderView = {
  _id: string;
  artistId: string;
  merchId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  status: ArtistMerchOrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingName?: string | null;
  shippingCity?: string | null;
  shippingPincode?: string | null;
  carrier?: string | null;
  trackingNumber?: string | null;
  shippedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
