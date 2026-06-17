"use client";

import QRCode from "qrcode";
import { useEffect, useRef } from "react";
import type { GuestlistTicketView } from "@/lib/guestlist";

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
};

/**
 * The golden ticket — a bright gold guest pass with the black Hoizr logo in
 * the top-left corner and a high-contrast QR on a white chip for scanning.
 */
export const GoldenTicket = ({ ticket }: { ticket: GuestlistTicketView }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (ticket.qrCodeData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, ticket.qrCodeData, {
        width: 208,
        margin: 1,
        color: { dark: "#141100", light: "#ffffff" },
      }).catch(() => undefined);
    }
  }, [ticket.qrCodeData]);

  const accepted = ticket.status === "ACCEPTED";

  return (
    <div
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl p-6 pt-14 text-[#2a1d00] shadow-2xl"
      style={{
        background:
          "linear-gradient(135deg,#fde6a8 0%,#f3cf6b 32%,#e2a93c 64%,#c98a25 100%)",
      }}
    >
      {/* Hoizr black logo, top-left corner. */}
      <img
        src="https://hoizr.com/logo/logoDark.png"
        alt="Hoizr"
        className="absolute left-5 top-5 h-5 w-auto"
      />
      <span className="absolute right-5 top-5 rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
        Guest Pass
      </span>

      <h2 className="text-xl font-extrabold leading-tight">
        {ticket.eventTitle ?? "Your event"}
      </h2>
      <p className="mt-1 text-sm font-medium text-[#5a4205]">
        {formatDate(ticket.eventDate)}
        {ticket.venue ? ` · ${ticket.venue}` : ""}
      </p>
      {ticket.contributorName ? (
        <p className="mt-0.5 text-xs text-[#6b5208]">
          Guestlist by {ticket.contributorName}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col items-center">
        {accepted && ticket.qrCodeData ? (
          <>
            <div className="rounded-2xl bg-white p-3 shadow-inner">
              <canvas ref={canvasRef} className="block h-52 w-52" />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#5a4205]">
              {ticket.checkedIn ? "Checked in ✓" : "Show this at the door"}
            </p>
          </>
        ) : ticket.status === "PENDING" ? (
          <div className="rounded-2xl bg-black/10 px-5 py-8 text-center">
            <p className="text-sm font-semibold">Pending approval</p>
            <p className="mt-1 text-xs text-[#5a4205]">
              Your pass appears here once the organizer approves you.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-black/10 px-5 py-8 text-center text-sm font-semibold">
            This pass is no longer valid.
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldenTicket;
