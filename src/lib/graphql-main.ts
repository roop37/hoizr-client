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
  if (process.env.NEXT_PUBLIC_HOIZR_ENV === "prod") {
    throw new Error(`${envKey} is required in production`);
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
