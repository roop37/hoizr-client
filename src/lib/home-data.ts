import { gqlMainRequest } from "./graphql-main";
import { gqlRequest } from "./graphql";
import { sdk } from "./sdk";
import { ACTIVE_CITIES_WITH_COORDS_QUERY, PUBLIC_EVENT_PEOPLE_QUERY } from "./queries";
import { PUBLIC_ARTISTS_QUERY } from "./artist-queries";
import { FALLBACK_INDIAN_CITIES } from "./city-fallbacks";
import type { PublicEventFilter, PublicEventListResponse } from "@/types/event";
import type { PublicArtistListResponse } from "@/types/artist";
import type { GenreTagMaster, IndianCityMaster } from "@/types/master";

export async function fetchPublishedEvents(input?: PublicEventFilter) {
  try {
    const data = await sdk.GetPublishedEvents({
      input: { page: 1, pageSize: input?.pageSize ?? 24, ...input },
    });
    return data.getPublishedEvents as PublicEventListResponse;
  } catch {
    return { events: [], total: 0, page: 1, pageSize: 0 };
  }
}

/**
 * Host (primary organizer) display name for one event — used to label
 * the home hero with the organizer's account name instead of a generic
 * brand tag. Isolated single-event lookup so the lightweight events feed
 * doesn't need to carry host data. Returns null on any failure.
 */
export async function fetchEventHostName(
  eventId: string
): Promise<string | null> {
  try {
    const data = await gqlRequest<{
      getPublicEventPeople: {
        organizers: { name: string; isPrimary: boolean }[];
      } | null;
    }>(PUBLIC_EVENT_PEOPLE_QUERY, { eventId });
    const orgs = data.getPublicEventPeople?.organizers ?? [];
    const primary = orgs.find((o) => o.isPrimary) ?? orgs[0];
    return primary?.name ?? null;
  } catch {
    return null;
  }
}

async function fetchActiveCities(): Promise<IndianCityMaster[]> {
  try {
    const data = await sdk.ActiveCitiesWithCoords();
    return data.getActiveIndianCities?.length
      ? (data.getActiveIndianCities as IndianCityMaster[])
      : FALLBACK_INDIAN_CITIES;
  } catch {
    try {
      const data = await sdk.ActiveCities();
      return data.getActiveIndianCities?.length
        ? (data.getActiveIndianCities as IndianCityMaster[])
        : FALLBACK_INDIAN_CITIES;
    } catch {
      try {
        const data = await gqlMainRequest<{
          getActiveIndianCities: IndianCityMaster[];
        }>(ACTIVE_CITIES_WITH_COORDS_QUERY);
        return data.getActiveIndianCities?.length
          ? data.getActiveIndianCities
          : FALLBACK_INDIAN_CITIES;
      } catch {
        return FALLBACK_INDIAN_CITIES;
      }
    }
  }
}

export async function fetchCustomerMasters() {
  const [citiesRes, genresRes] = await Promise.allSettled([
    fetchActiveCities(),
    sdk.ActiveGenreTags(),
  ]);

  return {
    cities:
      citiesRes.status === "fulfilled"
        ? citiesRes.value
        : [],
    genres:
      genresRes.status === "fulfilled"
        ? (genresRes.value.getActiveGenreTags as GenreTagMaster[])
        : [],
  };
}

export async function fetchPublicArtists(pageSize = 32) {
  try {
    const data = await gqlMainRequest<{ publicArtists: PublicArtistListResponse }>(PUBLIC_ARTISTS_QUERY, {
      input: { page: 1, pageSize },
    });
    return data.publicArtists;
  } catch {
    return { artists: [], total: 0, page: 1, pageSize: 0 };
  }
}
