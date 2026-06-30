import Link from "next/link";
import { HICONS } from "./icons";
import { HoizrLogo } from "./HoizrLogo";
import { SEO_CITIES, citySlug } from "@/lib/city-slug";

/**
 * Pre-launch footer. Rendered once at the layout level so it can pin
 * to the bottom of the viewport on short pages (sticky-when-short)
 * via the `.h-content` flex column in globals.css.
 *
 * The big HOIZR wordmark is omitted here — the sidebar already shows
 * it at the top on desktop, and the bottom mobile tabs identify the
 * brand on phones. The "Hoizr family" bar at the bottom keeps a
 * compact "Hoizr" link for cross-product navigation.
 */

const BUSINESS_URL = "https://business.hoizr.com";
// const ARTIST_URL = "https://artist.hoizr.com"; // pre-launch, see family bar
const INSTAGRAM_URL = "https://www.instagram.com/hoizr.technologies";
const CONTACT_PHONE_DISPLAY = "+91 83695 72945";
const CONTACT_PHONE_TEL = "tel:+918369572945";
const CONTACT_WHATSAPP = "https://wa.me/918369572945";

export const HFooter = () => (
  <footer className="h-footer">
    <div className="h-footer-grid">
      <div>
        <HoizrLogo size="default" />
        <p className="h-footer-tag">
          Where India goes out tonight. Find nights, book tickets, follow
          artists — all in one place.
        </p>
        <div className="h-footer-socials">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Hoizr on Instagram"
          >
            {HICONS.insta}
          </a>
        </div>
      </div>
      <div className="h-footer-cols">
        <div>
          <h4>Discover</h4>
          <Link href="/live">Tonight</Link>
          <Link href="/events">This weekend</Link>
          <Link href="/events?vertical=club">Club nights</Link>
          <Link href="/events?vertical=comedy">Comedy</Link>
          <Link href="/events?vertical=fest">Festivals</Link>
        </div>
        <div>
          <h4>Events by city</h4>
          {SEO_CITIES.map((c) => (
            <Link key={c} href={`/events-in/${citySlug(c)}`}>
              Events in {c}
            </Link>
          ))}
        </div>
        <div>
          <h4>For organisers</h4>
          <a href={BUSINESS_URL} target="_blank" rel="noreferrer">
            List an event ↗
          </a>
          <a href={BUSINESS_URL} target="_blank" rel="noreferrer">
            Marketing tools ↗
          </a>
          <a href={BUSINESS_URL} target="_blank" rel="noreferrer">
            Hoizr products ↗
          </a>
          <a href={`${BUSINESS_URL}/resources#stickers`} target="_blank" rel="noreferrer">
            Flyer stickers ↗
          </a>
          <a href={`${BUSINESS_URL}/about`} target="_blank" rel="noreferrer">
            About ↗
          </a>
        </div>
        <div>
          <h4>Contact</h4>
          <a href="mailto:contact@hoizr.com">contact@hoizr.com</a>
          <a href={CONTACT_PHONE_TEL}>Call {CONTACT_PHONE_DISPLAY}</a>
          <a href={CONTACT_WHATSAPP} target="_blank" rel="noreferrer">
            WhatsApp ↗
          </a>
          <a href="mailto:tech@hoizr.com">tech@hoizr.com</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Instagram ↗
          </a>
        </div>
        <div>
          <h4>Legal</h4>
          <a href={`${BUSINESS_URL}/legal/terms`} target="_blank" rel="noreferrer">
            Terms &amp; conditions ↗
          </a>
          <a href={`${BUSINESS_URL}/legal/privacy`} target="_blank" rel="noreferrer">
            Privacy policy ↗
          </a>
          <a href={`${BUSINESS_URL}/legal/cookies`} target="_blank" rel="noreferrer">
            Cookies ↗
          </a>
          <a href={`${BUSINESS_URL}/legal/entity`} target="_blank" rel="noreferrer">
            GST · CIN ↗
          </a>
        </div>
      </div>
    </div>
    <div className="h-footer-base">
      <div>© 2026 Hoizr Technologies Pvt. Ltd.</div>
      <div style={{ opacity: 0.7 }}>iOS app · Android app · coming soon</div>
    </div>
    <div className="h-footer-family">
      <span className="h-footer-family__label">The Hoizr family</span>
      <a href="https://hoizr.com">Hoizr</a>
      <a href={BUSINESS_URL} target="_blank" rel="noreferrer">
        Hoizr Business ↗
      </a>
      {/* Pre-launch: artist app not live yet. Restore when ready.
      <a href={ARTIST_URL} target="_blank" rel="noreferrer">
        Hoizr Artist ↗
      </a>
      */}
      <span style={{ opacity: 0.7 }}>Hoizr Artist · coming soon</span>
      <span style={{ opacity: 0.7 }}>Hoizr Promoters · coming soon</span>
    </div>
  </footer>
);
