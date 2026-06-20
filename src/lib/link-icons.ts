import {
  Globe,
  Instagram,
  Youtube,
  Twitter,
  Music2,
  Mail,
  MessageCircle,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

// ArtistLinkIcon enum keys (hoizr-shared). lucide lacks Spotify / TikTok /
// SoundCloud / Apple Music brand glyphs, so those use a neutral Music2.
const MAP: Record<string, LucideIcon> = {
  WEBSITE: Globe,
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  TWITTER: Twitter,
  SPOTIFY: Music2,
  SOUNDCLOUD: Music2,
  APPLE_MUSIC: Music2,
  TIKTOK: Music2,
  MERCH: ShoppingBag,
  CONTACT_EMAIL: Mail,
  WHATSAPP: MessageCircle,
  CUSTOM: Globe,
};

export const iconForLink = (icon?: string, _url?: string): LucideIcon =>
  (icon && MAP[icon]) || Globe;
