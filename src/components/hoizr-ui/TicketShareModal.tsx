"use client";

import { AlertTriangle, Copy, Download, Instagram, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  eventTitle?: string | null;
  eventDate?: string | null;
  orderShortId: string;
  qrPayload?: string | null;
  pageUrl: string;
};

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const TicketShareModal = ({
  open,
  onClose,
  eventTitle,
  eventDate,
  orderShortId,
  qrPayload,
  pageUrl,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [includeQr, setIncludeQr] = useState(true);
  const [qrWarningDismissed, setQrWarningDismissed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    if (!open || !qrPayload || !canvasRef.current) return;
    setQrError(false);
    QRCode.toCanvas(canvasRef.current, qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    }).catch(() => setQrError(true));
  }, [open, qrPayload]);

  if (!open) return null;

  const dateStr = eventDate
    ? new Date(eventDate).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const shareText = [
    `🎟️ ${eventTitle ?? "My ticket"}`,
    dateStr ? `📅 ${dateStr}` : null,
    `Order #${orderShortId} via Hoizr`,
  ]
    .filter(Boolean)
    .join("\n");

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  const openWhatsApp = () => {
    const msg = `${shareText}\n${pageUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openInstagram = async () => {
    await copyText("instagram", `${shareText}\n${pageUrl}`);
    window.open("https://instagram.com", "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyText("link", pageUrl);
      return;
    }
    try {
      await navigator.share({ title: eventTitle ?? "My ticket", text: shareText, url: pageUrl });
    } catch (err: any) {
      if (err?.name !== "AbortError") await copyText("link", pageUrl);
    }
  };

  const downloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `ticket-${orderShortId}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const showQrPanel = includeQr && !!qrPayload && !qrError;
  const showQrWarning = includeQr && !qrWarningDismissed;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#0d0d0f] p-6 pb-8 sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white transition"
        >
          <X size={16} />
        </button>

        <h2 className="mb-1 text-[15px] font-semibold text-white">Share ticket</h2>
        <p className="mb-5 text-[12px] text-white/50">
          {eventTitle ?? "Your ticket"} · #{orderShortId}
        </p>

        {/* Share targets */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            onClick={openWhatsApp}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-white hover:bg-white/[0.08] transition"
          >
            <span className="text-[#25D366]">
              <WhatsAppIcon />
            </span>
            <span className="text-[11px] font-medium">WhatsApp</span>
          </button>

          <button
            onClick={openInstagram}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-white hover:bg-white/[0.08] transition"
          >
            <Instagram size={20} className="text-[#E1306C]" />
            <span className="text-[11px] font-medium">Instagram</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-white hover:bg-white/[0.08] transition"
          >
            <Copy size={20} className="text-white/60" />
            <span className="text-[11px] font-medium">
              {copied === "link" ? "Copied!" : "Copy link"}
            </span>
          </button>
        </div>

        {/* QR toggle */}
        {qrPayload ? (
          <div className="mb-4">
            <button
              onClick={() => setIncludeQr((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
            >
              <span className="text-[13px] font-medium text-white">
                Share QR details
              </span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  includeQr ? "bg-emerald-500" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    includeQr ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>

            {showQrWarning && (
              <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-[11px] leading-relaxed text-amber-300">
                  Anyone with this QR can check in on your behalf. This
                  cannot be undone.
                </p>
                <button
                  onClick={() => setQrWarningDismissed(true)}
                  className="ml-auto shrink-0 text-[10px] font-semibold text-amber-400 hover:text-amber-300"
                >
                  OK
                </button>
              </div>
            )}

            {showQrPanel && (
              <div className="mt-3 flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                <canvas
                  ref={canvasRef}
                  className="rounded-lg"
                  style={{ width: 140, height: 140 }}
                />
                <button
                  onClick={downloadQr}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-1.5 text-[12px] font-medium text-white hover:bg-white/[0.10] transition"
                >
                  <Download size={12} />
                  Download QR
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Instagram copy hint */}
        {copied === "instagram" ? (
          <p className="text-center text-[11px] text-emerald-400">
            Copied — paste in your Instagram bio or story
          </p>
        ) : null}
      </div>
    </div>
  );
};
