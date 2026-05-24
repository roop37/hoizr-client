import type { Metadata } from "next";
import { FollowedArtistsClient } from "./FollowedArtistsClient";

export const metadata: Metadata = {
  title: "Following artists",
  description: "Artists you follow on Hoizr.",
};

export const dynamic = "force-dynamic";

export default function FollowedArtistsPage() {
  return <FollowedArtistsClient />;
}
