import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML coming from host-authored rich-text fields (terms,
 * refund policy, cancellation policy, event description, etc.).
 *
 * Hosts are authenticated business owners, not arbitrary users, but
 * any HTML that ends up in `dangerouslySetInnerHTML` must still be
 * sanitized to defend against accidental XSS via copy-pasted markup
 * and against a compromised host account.
 *
 * The default DOMPurify profile is conservative — it strips scripts,
 * event handlers and `javascript:` URLs while keeping the common
 * rich-text formatting tags (h1-h6, p, ul/ol/li, strong, em, a,
 * blockquote, br, etc.) plus safe attributes (href, target, rel).
 */
export const sanitizeRichText = (html?: string | null): string => {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // Force-open every anchor in a new tab so users don't lose the
    // event page when a host links out to their venue/site.
    ADD_ATTR: ["target", "rel"],
  });
};
