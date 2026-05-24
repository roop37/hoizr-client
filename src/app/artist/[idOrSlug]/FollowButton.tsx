"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { gqlRequest } from "@/lib/graphql";
import {
  FOLLOW_ARTIST_MUTATION,
  UNFOLLOW_ARTIST_MUTATION,
} from "@/lib/artist-queries";
import { useAuthStore } from "@/store/auth";

type Props = {
  artistId: string;
  isFollowing: boolean;
  totalFollowers: number;
};

export const FollowButton = ({
  artistId,
  isFollowing,
  totalFollowers,
}: Props) => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [following, setFollowing] = useState(isFollowing);
  const [count, setCount] = useState(totalFollowers);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!profile) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    setBusy(true);
    try {
      if (following) {
        await gqlRequest(UNFOLLOW_ARTIST_MUTATION, { artistId });
        setFollowing(false);
        setCount((n) => Math.max(0, n - 1));
      } else {
        await gqlRequest(FOLLOW_ARTIST_MUTATION, { artistId });
        setFollowing(true);
        setCount((n) => n + 1);
      }
    } catch (err) {
      // surface failure inline; full toasting is out of scope here
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy || !hydrated}
      onClick={toggle}
      className={
        following
          ? "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold transition hover:bg-cream disabled:opacity-60"
          : "inline-flex h-10 items-center gap-2 rounded-xl bg-dark px-4 text-sm font-semibold text-cream transition hover:opacity-95 disabled:opacity-60"
      }
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : null}
      {following ? "Following" : "Follow"}
      <span className="text-xs opacity-70">· {count}</span>
    </button>
  );
};
