"use client";

import { Bell, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";
import {
  dismissWebPushPrompt,
  hasDismissedWebPushPrompt,
  isWebPushConfigured,
  registerCustomerWebPush,
} from "@/lib/web-push";

export const WebPushPrompt = () => {
  const profile = useAuthStore((state) => state.profile);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !profile || !isWebPushConfigured()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (hasDismissedWebPushPrompt()) return;

    if (Notification.permission === "granted") {
      registerCustomerWebPush().catch(() => {});
      return;
    }
    if (Notification.permission === "default") {
      setVisible(true);
    }
  }, [hydrated, profile]);

  if (!visible || !profile) return null;

  const enable = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = await registerCustomerWebPush();
      if (token) {
        setVisible(false);
      } else {
        setMessage("Notifications were not enabled in this browser.");
      }
    } catch {
      setMessage("Unable to enable notifications right now.");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    dismissWebPushPrompt();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-cream p-4 shadow-xl md:left-auto md:right-6 md:w-[420px]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-accent">
          <Bell size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink">Get event updates faster</div>
          <p className="mt-1 text-sm text-muted">
            Enable browser notifications for ticket reminders, artist drops,
            and host campaign updates.
          </p>
          {message ? <p className="mt-2 text-sm text-red-600">{message}</p> : null}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={enable}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#c5ff3d] px-3 text-sm font-semibold text-[#0a0a0e] disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Enable
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-9 rounded-xl border border-border px-3 text-sm font-semibold text-ink"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-1 text-muted hover:bg-background hover:text-ink"
          aria-label="Dismiss notification prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
