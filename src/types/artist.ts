export type PublicArtistProfile = {
  _id: string;
  stageName?: string | null;
  firstName: string;
  lastName: string;
  bio?: string | null;
  tagline?: string | null;
  profilePhoto?: string | null;
  coverImage?: string | null;
  genres?: string[] | null;
  city?: string | null;
  state?: string | null;
  slug?: string | null;
  instagramLink?: string | null;
  spotifyLink?: string | null;
  youtubeLink?: string | null;
  soundcloudLink?: string | null;
  appleMusicLink?: string | null;
  twitterLink?: string | null;
  totalFollowersCount: number;
};

export type PublicArtistListItem = {
  _id: string;
  stageName?: string | null;
  firstName: string;
  lastName: string;
  slug?: string | null;
  profilePhoto?: string | null;
  tagline?: string | null;
  city?: string | null;
  state?: string | null;
  genres?: string[] | null;
  totalFollowersCount: number;
};

export type PublicArtistListResponse = {
  artists: PublicArtistListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicArtistLink = {
  _id: string;
  label: string;
  url: string;
  icon: string;
  position: number;
};

export type PublicArtistMerch = {
  _id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  stock?: number | null;
  images?: string[] | null;
  externalCheckoutUrl?: string | null;
};

export type PublicArtistRider = {
  _id: string;
  riderType: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
};

export type PublicArtistEvent = {
  eventId: string;
  title: string;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  coverImage?: string | null;
  hostName?: string | null;
};

export type FollowedArtist = {
  _id: string;
  firstName: string;
  lastName: string;
  slug?: string | null;
  profilePhoto?: string | null;
  tagline?: string | null;
  city?: string | null;
  state?: string | null;
  genres?: string[] | null;
  totalFollowersCount: number;
};

export type ArtistFollowerCounts = {
  totalFollowers: number;
  isFollowing: boolean;
};

export type PublicArtistGuestlist = {
  guestlistId: string;
  code: string;
  eventId: string;
  eventTitle: string;
  eventCity?: string | null;
  eventFlyer?: string | null;
  startDate?: string | null;
  isHighlighted: boolean;
  cap?: number | null;
  acceptedCount: number;
};
