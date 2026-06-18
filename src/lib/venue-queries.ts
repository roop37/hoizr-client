// Public venue queries — served by customer-server (port 4001). Only
// admin-verified, active venues are returned. Hand-written (not codegen)
// because the venue module post-dates the last `yarn codegen` run.

export type PublicVenue = {
  _id: string;
  name?: string | null;
  logo?: string | null;
  description?: string | null;
  venueType?: string | null;
  websiteUrl?: string | null;
  gallery?: string[] | null;
  address?: {
    formattedAddress?: string | null;
    city?: string | null;
    state?: string | null;
  } | null;
};

export type PublicVenuePage = {
  venues: PublicVenue[];
  total: number;
  page: number;
  pageSize: number;
};

// A host's public guestlist for an upcoming event, surfaced on the venue
// detail page (the other entry point besides the shared invite link). Gated
// server-side on host onboarding, so onboarding hosts never appear here.
export type VenuePublicGuestlist = {
  guestlistId: string;
  code: string;
  contributorName?: string | null;
  isFull: boolean;
  eventId: string;
  eventTitle?: string | null;
  eventFlyer?: string | null;
  eventDate?: string | null;
};

export const GET_VENUE_PUBLIC_GUESTLISTS_QUERY = /* GraphQL */ `
  query VenuePublicGuestlists($venueId: String!) {
    venuePublicGuestlists(venueId: $venueId) {
      guestlistId
      code
      contributorName
      isFull
      eventId
      eventTitle
      eventFlyer
      eventDate
    }
  }
`;

export const GET_PUBLIC_VENUES_QUERY = /* GraphQL */ `
  query GetPublicVenues($input: PublicVenueFilterInput) {
    getPublicVenues(input: $input) {
      venues {
        _id
        name
        logo
        description
        venueType
        websiteUrl
        gallery
        address {
          formattedAddress
          city
          state
        }
      }
      total
      page
      pageSize
    }
  }
`;

// NOTE: `address` only exposes formattedAddress / city / state. The
// AddressInfo GraphQL type has no `latitude`/`longitude` fields (it stores
// `coordinates` as a CoordinatePoint), so requesting them made the WHOLE
// operation fail validation → every venue 404'd ("Venue not found"). The
// detail page doesn't use lat/lng anyway (maps link uses the address text).
export const GET_PUBLIC_VENUE_BY_ID_QUERY = /* GraphQL */ `
  query GetPublicVenueById($id: String!) {
    getPublicVenueById(id: $id) {
      _id
      name
      logo
      description
      venueType
      websiteUrl
      gallery
      address {
        formattedAddress
        city
        state
      }
    }
  }
`;
