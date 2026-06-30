import { gqlRequest } from "@/lib/graphql";

/** Customer submits feedback tied to one of their orders. */
export const submitCustomerFeedback = async (input: {
  orderId: string;
  kind: "HOIZR_PLATFORM" | "EVENT";
  context: "CUSTOMER_POST_PURCHASE" | "CUSTOMER_POST_EVENT";
  rating?: number;
  comment?: string;
}): Promise<boolean> => {
  const data = await gqlRequest<{ submitCustomerFeedback: boolean }>(
    `mutation ($orderId: String!, $kind: String!, $context: String!, $rating: Int, $comment: String) {
      submitCustomerFeedback(orderId: $orderId, kind: $kind, context: $context, rating: $rating, comment: $comment)
    }`,
    input
  );
  return data.submitCustomerFeedback;
};
