export type PublicTicket = {
  _id: string;
  ticketCategory: string;
  ticketName: string;
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

export type PublicEventLocation = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formattedAddress?: string;
};

export type PublicEvent = {
  _id: string;
  title?: string;
  slug?: string;
  description?: string;
  eventFlyer?: string;
  horizontalFlyer?: string;
  eventType?: string[];
  startDate?: string;
  endDate?: string;
  city?: string;
  cityId?: string;
  genreTagIds?: string[];
  location?: PublicEventLocation;
  tickets?: PublicTicket[];
  extras?: PublicExtra[];
  ticketingEnabled?: boolean;
  isHighDemand?: boolean;
  isComingSoon?: boolean;
  refundPolicy?: string;
};

export type PublicEventListResponse = {
  events: PublicEvent[];
  total: number;
  page: number;
  pageSize: number;
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
