/**
 * Typed GraphQL SDK powered by `@graphql-codegen/typescript-graphql-request`.
 *
 * - Source operations live in `src/graphql/*.graphql`.
 * - Run `yarn codegen` (against a running customer-server on :4001) to
 *   regenerate `src/generated/graphql.ts`.
 * - Import `{ sdk }` from this file in components or server actions to
 *   call typed query/mutation functions (e.g. `sdk.GetPublishedEvents({...})`).
 *
 * The SDK reuses the same `gqlClient` from `lib/graphql.ts`, so cookies
 * and the access-token-refresh interceptor apply automatically.
 */
import { getSdk } from "@/generated/graphql";
import { gqlClient } from "./graphql";

export const sdk = getSdk(gqlClient);
