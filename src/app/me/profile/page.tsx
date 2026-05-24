import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "My profile",
  description: "Your Hoizr account details and profile picture.",
};

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  return <ProfileClient />;
}
