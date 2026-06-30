"use client";

import {
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth";

const SUPPORT_EMAIL = "contact@hoizr.com";
const SUPPORT_PHONE = "+91 83695 72945";
const SUPPORT_WHATSAPP = "918369572945";
const TICKET_STORAGE_KEY = "hoizr:support-tickets";

type Category =
  | "ORDER_ISSUE"
  | "PAYMENT_ISSUE"
  | "EVENT_QUESTION"
  | "ACCOUNT"
  | "OTHER";

const CATEGORY_LABELS: Record<Category, string> = {
  ORDER_ISSUE: "Issue with an order",
  PAYMENT_ISSUE: "Payment / refund",
  EVENT_QUESTION: "Question about an event",
  ACCOUNT: "My account",
  OTHER: "Something else",
};

type StoredTicket = {
  id: string;
  createdAt: string;
  category: Category;
  subject: string;
  message: string;
  orderRef?: string;
  name?: string;
  email?: string;
  phone?: string;
};

const randomTicketId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `HOI-${out}`;
};

const readStoredTickets = (): StoredTicket[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TICKET_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredTicket[]) : [];
  } catch {
    return [];
  }
};

const persistTicket = (ticket: StoredTicket) => {
  try {
    const existing = readStoredTickets();
    window.localStorage.setItem(
      TICKET_STORAGE_KEY,
      JSON.stringify([ticket, ...existing].slice(0, 25))
    );
  } catch {
    // Best-effort — the mail handoff below is the durable path.
  }
};

const buildMailto = (ticket: StoredTicket) => {
  const subject = `[${ticket.id}] ${CATEGORY_LABELS[ticket.category]} — ${ticket.subject}`;
  const lines = [
    `Ticket: ${ticket.id}`,
    `Category: ${CATEGORY_LABELS[ticket.category]}`,
    ticket.orderRef ? `Order ref: ${ticket.orderRef}` : "",
    ticket.name ? `Name: ${ticket.name}` : "",
    ticket.email ? `Email: ${ticket.email}` : "",
    ticket.phone ? `Phone: ${ticket.phone}` : "",
    "",
    ticket.message,
  ].filter(Boolean);
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    lines.join("\n")
  )}`;
};

export const SupportClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useAuthStore((s) => s.profile);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  const initialOrderRef = searchParams.get("orderId") ?? "";

  const [category, setCategory] = useState<Category>(
    (searchParams.get("category") as Category) ?? "ORDER_ISSUE"
  );
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderRef, setOrderRef] = useState(initialOrderRef);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticket, setTicket] = useState<StoredTicket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!profile) return;
    setName((current) =>
      current
        ? current
        : `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
    );
    setEmail((current) => current || profile.email || "");
    setPhone((current) => current || profile.phone || "");
  }, [profile]);

  const orderRefHelper = useMemo(() => {
    if (!orderRef) return null;
    return orderRef.length > 6 ? orderRef.slice(-6).toUpperCase() : orderRef;
  }, [orderRef]);

  const submit = (openMail: boolean) => {
    setError(null);
    if (!subject.trim() || !message.trim()) {
      setError("Add a subject and a message so we can help.");
      return;
    }
    if (!email.trim()) {
      setError("Add an email so we can reply.");
      return;
    }
    setSubmitting(true);
    const next: StoredTicket = {
      id: randomTicketId(),
      createdAt: new Date().toISOString(),
      category,
      subject: subject.trim(),
      message: message.trim(),
      orderRef: orderRef.trim() || undefined,
      name: name.trim() || undefined,
      email: email.trim(),
      phone: phone.trim() || undefined,
    };
    persistTicket(next);
    setTicket(next);
    setSubmitting(false);
    if (openMail) {
      // mailto: is the durable handoff while the server-side support
      // module is still being scoped — opens the customer's mail
      // client with the ticket ID, category, and message pre-filled.
      window.location.href = buildMailto(next);
    }
  };

  if (ticket) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10 text-cream md:py-12">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-cream"
        >
          <ChevronLeft size={14} /> Back
        </Link>
        <div className="mt-6 rounded-3xl border border-emerald-400/30 bg-emerald-500/[0.08] p-6 text-cream">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
            <CheckCircle2 size={12} />
            Ticket created
          </div>
          <h1 className="mt-4 text-2xl font-semibold">
            We got your message.
          </h1>
          <p className="mt-2 text-sm text-cream/80">
            Your reference is{" "}
            <span className="font-mono font-semibold text-cream">
              {ticket.id}
            </span>
            . The Hoizr team usually replies within one business day on{" "}
            <a
              className="underline"
              href={`mailto:${ticket.email}`}
            >
              {ticket.email}
            </a>
            .
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={buildMailto(ticket)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cream text-sm font-semibold text-ink transition hover:opacity-95"
            >
              <Mail size={14} />
              Email us a copy
            </a>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-cream/15 px-4 text-sm font-semibold text-cream/85 transition hover:bg-cream/10"
            >
              Back to home
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/80">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
            Reach us another way
          </div>
          <div className="mt-3 grid gap-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-cream/85 hover:text-cream"
            >
              <Mail size={14} className="text-cream/55" />
              {SUPPORT_EMAIL}
            </a>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-2 text-cream/85 hover:text-cream"
            >
              <Phone size={14} className="text-cream/55" />
              {SUPPORT_PHONE}
            </a>
            <a
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-cream/85 hover:text-cream"
            >
              <ExternalLink size={14} className="text-cream/55" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    "mt-1 h-10 w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-3 text-sm text-cream outline-none transition focus:border-[#c5ff3d]/60 focus:bg-cream/[0.06] placeholder:text-cream/40";
  const textareaClass =
    "mt-1 w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-3 py-2.5 text-sm text-cream outline-none transition focus:border-[#c5ff3d]/60 focus:bg-cream/[0.06] placeholder:text-cream/40";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/60";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 text-cream md:py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-cream"
      >
        <ChevronLeft size={14} /> Back
      </button>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
            <HelpCircle size={14} />
            Support
          </div>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
            How can we help?
          </h1>
          <p className="mt-1 text-sm text-cream/70">
            Tell us what&apos;s going on and we&apos;ll get back to you
            on email — usually within one business day.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 md:p-6">
        <label className="block text-sm">
          <span className={labelClass}>What&apos;s this about?</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={`${inputClass} appearance-none pr-8`}
          >
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => (
              <option key={key} value={key} className="bg-ink text-cream">
                {CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        {category === "ORDER_ISSUE" || category === "PAYMENT_ISSUE" ? (
          <label className="block text-sm">
            <span className={labelClass}>
              Order reference {orderRefHelper ? `(${orderRefHelper})` : ""}
            </span>
            <input
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder="Order #, e.g. HOI-7QX2P9"
              className={inputClass}
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className={labelClass}>Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="In one line — what should we look at first?"
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className={labelClass}>Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Walk us through what happened. The more detail you can share, the faster we can help."
            className={textareaClass}
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className={labelClass}>Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Reply email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className={labelClass}>Phone (optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91"
            className={inputClass}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c5ff3d] px-4 text-sm font-semibold text-ink transition hover:bg-[#d9ff6e] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}
            Create ticket &amp; send
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit(false)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cream/15 px-4 text-sm font-semibold text-cream/85 transition hover:bg-cream/10 disabled:opacity-60"
          >
            <MessageSquare size={16} />
            Just create the ticket
          </button>
        </div>
        <p className="text-xs text-cream/55">
          &ldquo;Create &amp; send&rdquo; opens your mail app with the
          ticket pre-filled. &ldquo;Just create&rdquo; logs it on this
          device — useful if you&apos;re on a shared phone.
        </p>
      </div>

      <div className="mt-6 rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-sm text-cream/80">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
          Prefer to reach out directly?
        </div>
        <div className="mt-3 grid gap-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-2 text-cream/85 hover:text-cream"
          >
            <Mail size={14} className="text-cream/55" />
            {SUPPORT_EMAIL}
          </a>
          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-2 text-cream/85 hover:text-cream"
          >
            <Phone size={14} className="text-cream/55" />
            {SUPPORT_PHONE}
          </a>
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-cream/85 hover:text-cream"
          >
            <ExternalLink size={14} className="text-cream/55" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
