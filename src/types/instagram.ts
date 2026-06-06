export type CustomerInstagramMedia = {
  id: string;
  caption?: string | null;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  permalink?: string | null;
  mediaType?: string | null;
  takenAt?: string | null;
};

export type CustomerInstagram = {
  _id: string;
  customerId: string;
  connected: boolean;
  attendeeVisibility: boolean;
  handle?: string | null;
  instagramUserId?: string | null;
  avatar?: string | null;
  biography?: string | null;
  followerCount?: number | null;
  mediaCount?: number | null;
  recentMedia?: CustomerInstagramMedia[] | null;
  city?: string | null;
  connectedAt?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type EventAttendeeWithInstagram = {
  customerId: string;
  firstName?: string | null;
  handle?: string | null;
  avatar?: string | null;
  city?: string | null;
};
