import { GraphQLClient } from "graphql-request";

/**
 * Read-only client pointed at main-server (port 4000). Used to fetch
 * public artist data; main-server hosts the artist module schemas and
 * resolvers. Customer auth / cart / order traffic still goes via
 * `gqlClient` to customer-server.
 */
const resolveEndpoint = (envKey: string, localFallback: string) => {
  const value = process.env[envKey];
  if (value) return value;
  if (
    process.env.NEXT_PUBLIC_HOIZR_ENV === "prod" &&
    typeof window !== "undefined"
  ) {
    // Pre-launch / build-time safe: never throw at module load. Soft
    // warning in the browser so misconfigured deployments are still
    // diagnosable. Set NEXT_PUBLIC_MAIN_API_URL once main-server is live.
    // eslint-disable-next-line no-console
    console.warn(
      `[hoizr] ${envKey} is not set; falling back to ${localFallback}`,
    );
  }
  return localFallback;
};

const endpoint = resolveEndpoint(
  "NEXT_PUBLIC_MAIN_API_URL",
  "http://localhost:4000/graphql"
);

export const gqlMainClient = new GraphQLClient(endpoint, {
  credentials: "include",
});

export const gqlMainRequest = <T>(
  query: string,
  variables?: Record<string, unknown>
) => gqlMainClient.request<T>(query, variables);
