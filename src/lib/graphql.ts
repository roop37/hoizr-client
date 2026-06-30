import { GraphQLClient } from "graphql-request";

/**
 * Resolve the GraphQL endpoint without throwing at module load.
 *
 * Pre-launch the API server may not be running and the env var may
 * not be configured on the host (Vercel build, etc) — throwing here
 * would crash the build before Next.js can render a single route.
 * Browser bundles need direct `process.env.NEXT_PUBLIC_*` references; dynamic
 * lookups such as `process.env[envKey]` are not reliably inlined by Next.js.
 * If a deployed build still carries a localhost value from local env files,
 * prefer the known deployed API for the selected Hoizr environment.
 */
const isLocalUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const isLocalRuntime = () => {
  if (typeof window !== "undefined") {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }
  return process.env.VERCEL !== "1";
};

const resolveEndpoint = (
  envKey: string,
  value: string | undefined,
  localFallback: string,
  deployedFallback: string
) => {
  if (value && (!isLocalUrl(value) || isLocalRuntime())) return value;
  if (!isLocalRuntime()) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hoizr] ${envKey} is not set for this deployment; using ${deployedFallback}`,
    );
    return deployedFallback;
  }
  return localFallback;
};

// customer-server lives at `orderapi.hoizr.com` / `dev-orderapi.hoizr.com`
// per the runtime infra (docs/DEV_INFRA_RUNTIME.md §3). The historical
// `customer-api.hoizr.com` hostname from HOIZR_INFRASTRUCTURE_PLAN.md
// was never the deployed name — keep this in sync with the actual DO
// droplet hostnames.
const deployedCustomerEndpoint =
  process.env.NEXT_PUBLIC_HOIZR_ENV === "prod"
    ? "https://orderapi.hoizr.com/graphql"
    : "https://dev-orderapi.hoizr.com/graphql";

const endpoint = resolveEndpoint(
  "NEXT_PUBLIC_CUSTOMER_API_URL",
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL,
  "http://localhost:4001/graphql",
  deployedCustomerEndpoint
);

/**
 * Origin of the customer-server (everything before `/graphql`). Used by
 * non-GraphQL surfaces — currently the Instagram OAuth start route at
 * `/auth/instagram/start` and its callback. Browser navigations to
 * customer-server need the host to match the cookie domain (the JWT
 * cookie is scoped to the API origin), so we always full-page-redirect
 * to this base rather than proxying through hoizr-client.
 */
export const customerApiOrigin = endpoint.replace(/\/graphql\/?$/, "");

const TOKEN_REFRESH = `mutation { customerTokenRefresh { success } }`;

type RefreshPayload = { customerTokenRefresh?: { success?: boolean } };

// `cache: 'no-store'` defeats every layer of the Next.js Data Cache.
// Even though pages set `dynamic = "force-dynamic"` and graphql-request
// issues POSTs (which Next does not cache by default), every consumer
// pulls live data — no edge or build-time staleness can leak into a
// render. `Cache-Control: no-cache` blocks any reverse proxy in between
// (Cloudflare, etc) from serving a cached GraphQL response.
const noStoreInit: RequestInit = { cache: "no-store" };

export const gqlClient = new GraphQLClient(endpoint, {
  credentials: "include",
  cache: "no-store",
  headers: { "Cache-Control": "no-cache" },
  fetch: async (input, init) => {
    const initWithNoStore: RequestInit = { ...noStoreInit, ...init, cache: "no-store" };
    let response = await fetch(input as RequestInfo, initWithNoStore);
    if (response.status === 401) {
      try {
        const refresh = new GraphQLClient(endpoint, {
          credentials: "include",
          cache: "no-store",
        });
        // customer-server's resolver returns HTTP 200 with { success: false }
        // when the refresh token is missing / expired / mismatched (see
        // auth.resolver.ts:customerTokenRefresh). Only retry the original
        // request if success === true; otherwise let the 401 stand so the
        // app routes the user back to /login instead of looping.
        const result = (await refresh.request(TOKEN_REFRESH)) as RefreshPayload;
        if (result?.customerTokenRefresh?.success === true) {
          response = await fetch(input as RequestInfo, initWithNoStore);
        }
      } catch {
        // fall through with 401
      }
    }
    return response;
  },
});

export const gqlRequest = <T>(query: string, variables?: Record<string, unknown>) =>
  gqlClient.request<T>(query, variables);
