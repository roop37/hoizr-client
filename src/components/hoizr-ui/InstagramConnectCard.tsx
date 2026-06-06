"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Instagram,
  Loader2,
  RefreshCcw,
  Unplug,
  Users,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { customerApiOrigin, gqlRequest } from "@/lib/graphql";
import {
  DISCONNECT_INSTAGRAM_MUTATION,
  GET_MY_INSTAGRAM_QUERY,
  SYNC_MY_INSTAGRAM_MUTATION,
  UPDATE_INSTAGRAM_VISIBILITY_MUTATION,
} from "@/lib/queries";
import type { CustomerInstagram } from "@/types/instagram";

const formatCount = (n?: number | null): string => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
};

const formatRelativeSync = (iso?: string | null): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  const delta = Date.now() - date.getTime();
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const InstagramConnectCard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<CustomerInstagram | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<
    | null
    | "connect"
    | "disconnect"
    | "sync"
    | "visibility"
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [returnBanner, setReturnBanner] = useState<
    | null
    | { tone: "ok" | "warn" | "err"; message: string }
  >(null);

  const refetch = async (): Promise<CustomerInstagram | null> => {
    try {
      const d = await gqlRequest<{ getMyInstagram: CustomerInstagram | null }>(
        GET_MY_INSTAGRAM_QUERY
      );
      setData(d.getMyInstagram ?? null);
      return d.getMyInstagram ?? null;
    } catch {
      setData(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    refetch().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
    // refetch is recreated each render but its body is stable; we want
    // the initial load to happen exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The OAuth callback redirects back to /me/profile?ig=connected
  // (or ?ig=denied / ?ig=error). Pick that up, show a short banner,
  // refetch the connection, and strip the query so a reload doesn't
  // re-toast.
  useEffect(() => {
    const igParam = searchParams.get("ig");
    if (!igParam) return;
    const reason = searchParams.get("reason") ?? undefined;
    if (igParam === "connected") {
      setReturnBanner({
        tone: "ok",
        message: "Instagram connected. Synced your handle + last 10 posts.",
      });
      refetch();
    } else if (igParam === "denied") {
      setReturnBanner({
        tone: "warn",
        message:
          "Instagram authorisation was cancelled. You can try again any time.",
      });
    } else {
      setReturnBanner({
        tone: "err",
        message: `Couldn't finish the Instagram handshake${
          reason ? ` (${reason})` : ""
        }. Please retry.`,
      });
    }
    // Clear the query params without reloading. Replace state on the
    // history entry so the back button doesn't bounce the banner.
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.delete("ig");
      u.searchParams.delete("reason");
      router.replace(`${u.pathname}${u.search}${u.hash}`);
    }
    const t = window.setTimeout(() => setReturnBanner(null), 6000);
    return () => window.clearTimeout(t);
    // We only want to react to mount-time params; deliberately not
    // chaining searchParams as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = () => {
    setError(null);
    setBusy("connect");
    // Full-page navigate to customer-server's OAuth start. The cookie
    // travels along; the start route signs a state blob and 302s to
    // instagram.com. After the user authorises, the callback route
    // redirects back to /me/profile with ?ig=connected.
    if (typeof window !== "undefined") {
      window.location.assign(`${customerApiOrigin}/auth/instagram/start`);
    }
  };

  const disconnect = async () => {
    setError(null);
    setBusy("disconnect");
    try {
      await gqlRequest(DISCONNECT_INSTAGRAM_MUTATION);
      setData((prev) =>
        prev ? { ...prev, connected: false } : prev
      );
    } catch (err: any) {
      setError(err?.message ?? "Couldn't disconnect");
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setError(null);
    setBusy("sync");
    try {
      const d = await gqlRequest<{
        syncMyInstagram: CustomerInstagram | null;
      }>(SYNC_MY_INSTAGRAM_MUTATION);
      if (d.syncMyInstagram) setData(d.syncMyInstagram);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't refresh");
    } finally {
      setBusy(null);
    }
  };

  const toggleVisibility = async () => {
    if (!data) return;
    setError(null);
    setBusy("visibility");
    const next = !data.attendeeVisibility;
    // Optimistic flip — falls back if the server rejects.
    setData({ ...data, attendeeVisibility: next });
    try {
      const d = await gqlRequest<{
        updateInstagramVisibility: CustomerInstagram;
      }>(UPDATE_INSTAGRAM_VISIBILITY_MUTATION, {
        input: { attendeeVisibility: next },
      });
      setData(d.updateInstagramVisibility);
    } catch (err: any) {
      setData((prev) =>
        prev ? { ...prev, attendeeVisibility: !next } : prev
      );
      setError(err?.message ?? "Couldn't update visibility");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/70">
        <div className="inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          Loading Instagram…
        </div>
      </div>
    );
  }

  const isConnected = Boolean(data?.connected);
  const lastSyncLabel = formatRelativeSync(data?.lastSyncedAt);
  const media = data?.recentMedia ?? [];

  return (
    <section className="rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-cream md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
            <Instagram size={14} />
            Instagram
          </div>
          <p className="mt-2 text-sm text-cream/75">
            Connect your Instagram so other Hoizr-goers can find you at
            events you&apos;ve booked. We pull your handle, recent
            photos, and follower count.
          </p>
        </div>
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
            <CheckCircle2 size={12} />
            Connected
          </span>
        ) : null}
      </div>

      {!isConnected ? (
        <div className="mt-4 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy === "connect"}
            onClick={connect}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E1306C] to-[#5851DB] px-4 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(225,48,108,0.65)] transition hover:opacity-95 disabled:opacity-60"
          >
            {busy === "connect" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Instagram size={16} />
            )}
            Continue with Instagram
          </button>
          <p className="text-[11px] leading-relaxed text-cream/55">
            We&apos;ll redirect you to Instagram&apos;s sign-in. We only
            request <span className="font-semibold text-cream/75">read
            access</span> to your handle, biography, follower count, and
            last 10 posts. Personal accounts may be asked to convert to a
            free Creator account during sign-in.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span
              className="block h-14 w-14 shrink-0 rounded-full bg-cream/10 ring-1 ring-inset ring-cream/15"
              style={
                data?.avatar
                  ? {
                      backgroundImage: `url(${data.avatar})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">
                @{data?.handle ?? "instagram"}
              </div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 text-xs text-cream/65">
                <span className="inline-flex items-center gap-1">
                  <Users size={12} />
                  {formatCount(data?.followerCount)} followers
                </span>
                <span>{formatCount(data?.mediaCount)} posts</span>
                {lastSyncLabel ? (
                  <span>Synced {lastSyncLabel}</span>
                ) : null}
              </div>
              {data?.biography ? (
                <div className="mt-1 line-clamp-1 text-xs text-cream/55">
                  {data.biography}
                </div>
              ) : null}
            </div>
          </div>

          {media.length ? (
            <div className="mt-4 grid grid-cols-5 gap-1.5">
              {media.slice(0, 10).map((m) => (
                <div
                  key={m.id}
                  className="aspect-square overflow-hidden rounded-md bg-cream/[0.06]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.thumbnailUrl ?? m.mediaUrl}
                    alt={m.caption ?? "Instagram post"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex items-start justify-between gap-3 rounded-2xl border border-cream/10 bg-cream/[0.03] p-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                Show me on events I&apos;ve booked
              </div>
              <p className="mt-0.5 text-xs text-cream/55">
                With this on, other ticket-holders can see your handle
                and avatar in the event&apos;s attendee row. They have to
                connect Instagram to see anyone.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data?.attendeeVisibility)}
              disabled={busy === "visibility"}
              onClick={toggleVisibility}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                data?.attendeeVisibility
                  ? "bg-[#c5ff3d]"
                  : "bg-cream/[0.12] ring-1 ring-inset ring-cream/15"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-ink shadow transition ${
                  data?.attendeeVisibility ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy === "sync"}
              onClick={sync}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cream/15 px-3 text-xs font-semibold text-cream/85 transition hover:bg-cream/10 disabled:opacity-60"
            >
              {busy === "sync" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCcw size={14} />
              )}
              Refresh
            </button>
            <button
              type="button"
              disabled={busy === "disconnect"}
              onClick={disconnect}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/30 px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-60"
            >
              {busy === "disconnect" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Unplug size={14} />
              )}
              Disconnect
            </button>
          </div>
        </>
      )}

      {returnBanner ? (
        <div
          className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
            returnBanner.tone === "ok"
              ? "border border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-200"
              : returnBanner.tone === "warn"
                ? "border border-amber-400/30 bg-amber-500/[0.08] text-amber-200"
                : "border border-rose-400/30 bg-rose-500/[0.08] text-rose-200"
          }`}
        >
          {returnBanner.tone === "ok" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{returnBanner.message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      ) : null}
    </section>
  );
};
