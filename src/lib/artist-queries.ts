// Queries hitting main-server's artist module.
export const PUBLIC_ARTISTS_QUERY = `
  query PublicArtists($input: PublicArtistFilterInput) {
    publicArtists(input: $input) {
      artists {
        _id
        stageName
        firstName
        lastName
        slug
        profilePhoto
        tagline
        city
        state
        genres
        totalFollowersCount
      }
      total
      page
      pageSize
    }
  }
`;

export const PUBLIC_ARTIST_PROFILE_QUERY = `
  query PublicArtistProfile($idOrSlug: String!) {
    publicArtistProfile(idOrSlug: $idOrSlug) {
      _id
      stageName
      firstName
      lastName
      bio
      tagline
      profilePhoto
      coverImage
      genres
      city
      state
      slug
      instagramLink
      spotifyLink
      youtubeLink
      soundcloudLink
      appleMusicLink
      twitterLink
      totalFollowersCount
    }
  }
`;

export const PUBLIC_ARTIST_LINKS_QUERY = `
  query PublicArtistLinks($idOrSlug: String!) {
    publicArtistLinks(idOrSlug: $idOrSlug) {
      _id
      label
      url
      icon
      position
    }
  }
`;

export const PUBLIC_ARTIST_MERCH_QUERY = `
  query PublicArtistMerch($idOrSlug: String!) {
    publicArtistMerch(idOrSlug: $idOrSlug) {
      _id
      name
      description
      price
      currency
      stock
      images
      externalCheckoutUrl
    }
  }
`;

export const PUBLIC_ARTIST_RIDERS_QUERY = `
  query PublicArtistRiders($idOrSlug: String!) {
    publicArtistRiders(idOrSlug: $idOrSlug) {
      _id
      riderType
      title
      description
      fileUrl
      fileType
    }
  }
`;

export const PUBLIC_ARTIST_EVENTS_QUERY = `
  query PublicArtistEvents($idOrSlug: String!) {
    publicArtistEvents(idOrSlug: $idOrSlug) {
      eventId
      title
      city
      startDate
      endDate
      coverImage
      hostName
    }
  }
`;

export const PUBLIC_ARTIST_GUESTLISTS_QUERY = `
  query PublicArtistGuestlists($idOrSlug: String!) {
    publicArtistGuestlists(idOrSlug: $idOrSlug) {
      guestlistId
      code
      eventId
      eventTitle
      eventCity
      eventFlyer
      startDate
      isHighlighted
      cap
      acceptedCount
    }
  }
`;

export const PUBLIC_ARTIST_FOLLOWER_COUNTS_QUERY = `
  query PublicArtistFollowerCounts($idOrSlug: String!) {
    publicArtistFollowerCounts(idOrSlug: $idOrSlug) {
      totalFollowers
      isFollowing
    }
  }
`;

// Customer-server: follow / unfollow.
export const FOLLOW_ARTIST_MUTATION = `
  mutation FollowArtist($artistId: String!) {
    followArtist(artistId: $artistId) {
      _id
      artistId
    }
  }
`;

export const UNFOLLOW_ARTIST_MUTATION = `
  mutation UnfollowArtist($artistId: String!) {
    unfollowArtist(artistId: $artistId)
  }
`;
