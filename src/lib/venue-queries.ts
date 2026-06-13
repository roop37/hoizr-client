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
    latitude?: number | null;
    longitude?: number | null;
  } | null;
};

export type PublicVenuePage = {
  venues: PublicVenue[];
  total: number;
  page: number;
  pageSize: number;
};

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
        latitude
        longitude
      }
    }
  }
`;
