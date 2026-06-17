import { gqlRequest } from "./graphql";

export type GuestlistJoinView = {
  guestlistId: string;
  code: string;
  eventId: string;
  eventTitle?: string | null;
  eventFlyer?: string | null;
  eventDate?: string | null;
  city?: string | null;
  contributorName?: string | null;
  isPublic: boolean;
  isFull: boolean;
  alreadyJoined: boolean;
  myEntryStatus?: "PENDING" | "ACCEPTED" | "REVOKED" | null;
};

export type GuestlistTicketView = {
  entryId: string;
  eventId: string;
  eventTitle?: string | null;
  eventFlyer?: string | null;
  eventDate?: string | null;
  venue?: string | null;
  contributorName?: string | null;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  qrCodeData?: string | null;
  checkedIn: boolean;
};

const GUESTLIST_BY_CODE_QUERY = `
  query GuestlistByCode($code: String!) {
    guestlistByCode(code: $code) {
      guestlistId
      code
      eventId
      eventTitle
      eventFlyer
      eventDate
      city
      contributorName
      isPublic
      isFull
      alreadyJoined
      myEntryStatus
    }
  }
`;

const JOIN_GUESTLIST_MUTATION = `
  mutation JoinGuestlist($code: String!) {
    joinGuestlist(code: $code) {
      entryId
      eventId
      eventTitle
      eventFlyer
      eventDate
      venue
      contributorName
      status
      qrCodeData
      checkedIn
    }
  }
`;

const MY_GUESTLIST_TICKETS_QUERY = `
  query MyGuestlistTickets {
    myGuestlistTickets {
      entryId
      eventId
      eventTitle
      eventFlyer
      eventDate
      venue
      contributorName
      status
      qrCodeData
      checkedIn
    }
  }
`;

export async function fetchGuestlistByCode(
  code: string
): Promise<GuestlistJoinView | null> {
  try {
    const data = await gqlRequest<{ guestlistByCode: GuestlistJoinView }>(
      GUESTLIST_BY_CODE_QUERY,
      { code }
    );
    return data.guestlistByCode ?? null;
  } catch {
    return null;
  }
}

export async function joinGuestlist(
  code: string
): Promise<GuestlistTicketView> {
  const data = await gqlRequest<{ joinGuestlist: GuestlistTicketView }>(
    JOIN_GUESTLIST_MUTATION,
    { code }
  );
  return data.joinGuestlist;
}

export type PublicGuestlistView = {
  guestlistId: string;
  code: string;
  contributorName?: string | null;
  contributorType: string;
  isFull: boolean;
};

const EVENT_PUBLIC_GUESTLISTS_QUERY = `
  query EventPublicGuestlists($eventId: String!) {
    eventPublicGuestlists(eventId: $eventId) {
      guestlistId
      code
      contributorName
      contributorType
      isFull
    }
  }
`;

export async function fetchEventPublicGuestlists(
  eventId: string
): Promise<PublicGuestlistView[]> {
  try {
    const data = await gqlRequest<{
      eventPublicGuestlists: PublicGuestlistView[];
    }>(EVENT_PUBLIC_GUESTLISTS_QUERY, { eventId });
    return data.eventPublicGuestlists ?? [];
  } catch {
    return [];
  }
}

export async function fetchMyGuestlistTickets(): Promise<GuestlistTicketView[]> {
  try {
    const data = await gqlRequest<{
      myGuestlistTickets: GuestlistTicketView[];
    }>(MY_GUESTLIST_TICKETS_QUERY);
    return data.myGuestlistTickets ?? [];
  } catch {
    return [];
  }
}
