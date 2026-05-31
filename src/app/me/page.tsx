import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// `/me` is the sidebar's "Profile" entry — bounce to the real profile
// page. Keeping the redirect on the server so the URL change is one
// hop with no client-side flash.
export default function MeIndex() {
  redirect("/me/profile");
}
