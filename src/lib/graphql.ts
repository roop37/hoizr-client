import { GraphQLClient } from "graphql-request";

/**
 * Resolve the GraphQL endpoint without throwing at module load.
 *
 * Pre-launch the API server may not be running and the env var may
 * not be configured on the host (Vercel build, etc) — throwing here
 * would crash the build before Next.js can render a single route.
 * Instead we fall back to a local URL; runtime requests will fail
 * with a network error which the callers in `home-data.ts` already
 * catch (returning empty lists). Set `NEXT_PUBLIC_CUSTOMER_API_URL`
 * in the deployment once the server is back online.
 */
const resolveEndpoint = (envKey: string, localFallback: string) => {
  const value = process.env[envKey];
  if (value) return value;
  if (
    process.env.NEXT_PUBLIC_HOIZR_ENV === "prod" &&
    typeof window !== "undefined"
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `[hoizr] ${envKey} is not set; falling back to ${localFallback}`,
    );
  }
  return localFallback;
};

const endpoint = resolveEndpoint(
  "NEXT_PUBLIC_CUSTOMER_API_URL",
  "http://localhost:4001/graphql"
);

const TOKEN_REFRESH = `mutation { customerTokenRefresh { success } }`;

type RefreshPayload = { customerTokenRefresh?: { success?: boolean } };

export const gqlClient = new GraphQLClient(endpoint, {
  credentials: "include",
  fetch: async (input, init) => {
    let response = await fetch(input as RequestInfo, init);
    if (response.status === 401) {
      try {
        const refresh = new GraphQLClient(endpoint, { credentials: "include" });
        // customer-server's resolver returns HTTP 200 with { success: false }
        // when the refresh token is missing / expired / mismatched (see
        // auth.resolver.ts:customerTokenRefresh). Only retry the original
        // request if success === true; otherwise let the 401 stand so the
        // app routes the user back to /login instead of looping.
        const result = (await refresh.request(TOKEN_REFRESH)) as RefreshPayload;
        if (result?.customerTokenRefresh?.success === true) {
          response = await fetch(input as RequestInfo, init);
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
