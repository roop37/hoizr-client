import { gqlRequest } from "./graphql";
import { gqlMainRequest } from "./graphql-main";
import {
  ACTIVE_CITIES_QUERY,
  ACTIVE_CITIES_WITH_COORDS_QUERY,
  ACTIVE_GENRE_TAGS_QUERY,
  PUBLIC_EVENT_LIST_QUERY,
} from "./queries";
import { PUBLIC_ARTISTS_QUERY } from "./artist-queries";
import { FALLBACK_INDIAN_CITIES } from "./city-fallbacks";
import type { PublicEventFilter, PublicEventListResponse } from "@/types/event";
import type { PublicArtistListResponse } from "@/types/artist";
import type { GenreTagMaster, IndianCityMaster } from "@/types/master";

export async function fetchPublishedEvents(input?: PublicEventFilter) {
  try {
    const data = await gqlRequest<{ getPublishedEvents: PublicEventListResponse }>(PUBLIC_EVENT_LIST_QUERY, {
      input: { page: 1, pageSize: input?.pageSize ?? 24, ...input },
    });
    return data.getPublishedEvents;
  } catch {
    return { events: [], total: 0, page: 1, pageSize: 0 };
  }
}

async function fetchActiveCities(): Promise<IndianCityMaster[]> {
  try {
    const data = await gqlRequest<{ getActiveIndianCities: IndianCityMaster[] }>(
      ACTIVE_CITIES_WITH_COORDS_QUERY,
    );
    return data.getActiveIndianCities?.length
      ? data.getActiveIndianCities
      : FALLBACK_INDIAN_CITIES;
  } catch {
    try {
      const data = await gqlRequest<{ getActiveIndianCities: IndianCityMaster[] }>(
        ACTIVE_CITIES_QUERY,
      );
      return data.getActiveIndianCities?.length
        ? data.getActiveIndianCities
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
    gqlRequest<{ getActiveGenreTags: GenreTagMaster[] }>(ACTIVE_GENRE_TAGS_QUERY),
  ]);

  return {
    cities:
      citiesRes.status === "fulfilled"
        ? citiesRes.value
        : [],
    genres:
      genresRes.status === "fulfilled"
        ? genresRes.value.getActiveGenreTags
        : [],
  };
}

export async function fetchPublicArtists(pageSize = 32) {
  try {
    const data = await gqlRequest<{ publicArtists: PublicArtistListResponse }>(PUBLIC_ARTISTS_QUERY, {
      input: { page: 1, pageSize },
    });
    return data.publicArtists;
  } catch {
    return { artists: [], total: 0, page: 1, pageSize: 0 };
  }
}
