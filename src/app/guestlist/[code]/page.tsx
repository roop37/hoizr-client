import GuestlistJoinClient from "./GuestlistJoinClient";

export const dynamic = "force-dynamic";

// `alreadyJoined` + the golden ticket need the customer session, so the page
// is client-driven (the client fetches with credentials).
export default function GuestlistJoinPage({
  params,
}: {
  params: { code: string };
}) {
  return <GuestlistJoinClient code={params.code} />;
}
