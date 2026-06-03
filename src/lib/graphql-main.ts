import { GraphQLClient } from "graphql-request";

/**
 * Read-only client pointed at main-server (port 4000). Used to fetch
 * public artist data; main-server hosts the artist module schemas and
 * resolvers. Customer auth / cart / order traffic still goes via
 * `gqlClient` to customer-server.
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
    // Pre-launch / build-time safe: never throw at module load. Soft
    // warning in the browser so misconfigured deployments are still
    // diagnosable. Set NEXT_PUBLIC_MAIN_API_URL once main-server is live.
    // eslint-disable-next-line no-console
    console.warn(
      `[hoizr] ${envKey} is not set for this deployment; using ${deployedFallback}`,
    );
    return deployedFallback;
  }
  return localFallback;
};

const deployedMainEndpoint =
  process.env.NEXT_PUBLIC_HOIZR_ENV === "prod"
    ? "https://api.hoizr.com/graphql"
    : "https://dev-api.hoizr.com/graphql";

const endpoint = resolveEndpoint(
  "NEXT_PUBLIC_MAIN_API_URL",
  process.env.NEXT_PUBLIC_MAIN_API_URL,
  "http://localhost:4000/graphql",
  deployedMainEndpoint
);

export const gqlMainClient = new GraphQLClient(endpoint, {
  credentials: "include",
});

export const gqlMainRequest = <T>(
  query: string,
  variables?: Record<string, unknown>
) => gqlMainClient.request<T>(query, variables);
