export type PublicTicket = {
  _id: string;
  ticketCategory: string;
  ticketName: string;
  // Multi-day: EventDay.dayId, the "ALL_DAYS" festival-pass sentinel, or
  // null/undefined on a single-day event.
  dayId?: string | null;
  ticketType?: string;
  ticketCapacity: number;
  ticketSold: number;
  ticketPrice: number;
  ticketInfo?: string;
  maxTicketPerUser?: number;
  ticketGST?: string;
  gstRate?: number;
  markAsComingSoon?: boolean;
  markAsOnGroundOnly?: boolean;
  ticketVisible?: boolean;
};

export type PublicExtra = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sold?: number;
  image?: string;
  type: string;
};

export type PublicEventGalleryItem = {
  url: string;
  type: "IMAGE" | "VIDEO" | string;
};

export type PublicEventGuide = {
  languageIds?: string[];
  minimumEntryAge?: string;
  paidEntryAge?: string;
  venueLayout?: string;
  seatingArrangement?: string;
  kidFriendly?: string;
  petFriendly?: string;
  gatesOpenBeforeEvent?: boolean;
  gatesOpenLeadHours?: number;
  gatesOpenLeadMinutes?: number;
  youtubeLink?: string;
};

export type PublicEventFAQ = {
  question: string;
  answer: string;
};

export type PublicEventDay = {
  dayId: string;
  title: string;
  startDate: string;
  endDate: string;
  // Per-day venue for a multi-city event; absent ⇒ uses the event location.
  location?: PublicEventLocation;
};

export type PublicPlaceInfo = {
  placeId?: string;
  displayName?: string;
};

export type PublicEventLocation = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formattedAddress?: string;
  place?: PublicPlaceInfo;
  /**
   * GeoJSON point. `coordinates` is `[lng, lat]` per the spec — beware
   * of the order. Use `coordToLatLng()` from `lib/geo.ts` to unpack.
   */
  coordinate?: { type?: string | null; coordinates?: number[] | null };
};

export type PublicEvent = {
  _id: string;
  title?: string;
  slug?: string;
  description?: string;
  eventFlyer?: string;
  horizontalFlyer?: string;
  videoSneakPeek?: string;
  gallery?: PublicEventGalleryItem[];
  eventType?: string[];
  startDate?: string;
  endDate?: string;
  markSeparateDays?: boolean;
  // Multi-city: each day has its own venue/city.
  multiCity?: boolean;
  // Per-day segments; present (length >= 2) only for a multi-day event.
  days?: PublicEventDay[];
  city?: string;
  cityId?: string;
  genreTagIds?: string[];
  location?: PublicEventLocation;
  tickets?: PublicTicket[];
  extras?: PublicExtra[];
  ticketingEnabled?: boolean;
  isHighDemand?: boolean;
  isComingSoon?: boolean;
  ticketingTerms?: string;
  refundPolicy?: string;
  cancellationPolicy?: string;
  eventGuide?: PublicEventGuide;
  faqs?: PublicEventFAQ[];
  eventInstructions?: string[];
  prohibitedItems?: string[];
};

export type PublicLanguageMaster = {
  _id: string;
  value: string;
  code?: string;
  nativeName?: string;
};

export type PublicProhibitedItemMaster = {
  _id: string;
  value: string;
  slug: string;
};

export type PublicEventListResponse = {
  events: PublicEvent[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicEventArtistEntry = {
  _id?: string;
  name: string;
  picture?: string;
  tagline?: string;
  bio?: string;
  slug?: string;
  instagramLink?: string;
  spotifyLink?: string;
  youtubeLink?: string;
  isPhantom: boolean;
};

export type PublicEventOrganizerEntry = {
  _id?: string;
  name: string;
  logo?: string;
  description?: string;
  city?: string;
  isPrimary: boolean;
};

export type PublicEventPeopleResponse = {
  artists: PublicEventArtistEntry[];
  organizers: PublicEventOrganizerEntry[];
};

export type PublicEventFilter = {
  city?: string;
  cityId?: string;
  eventCategoryIds?: string[];
  genreTagIds?: string[];
  startDateFrom?: string;
  startDateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  pageSize?: number;
};
