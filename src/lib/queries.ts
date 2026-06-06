// --- Public reads ---
//
// New queries should be added to src/graphql/*.graphql and consumed via
// the typed SDK in `lib/sdk.ts` (`sdk.OperationName(...)`). The raw
// strings below are kept for the modules that haven't been migrated yet
// — both styles can coexist while the migration is in progress.

export const PUBLIC_EVENT_LIST_QUERY = `
  query GetPublishedEvents($input: PublicEventFilterInput) {
    getPublishedEvents(input: $input) {
      events {
        _id
        title
        slug
        description
        eventFlyer
        horizontalFlyer
        videoSneakPeek
        eventType
        startDate
        endDate
        city
        cityId
        genreTagIds
        location {
          city
          coordinate { type coordinates }
        }
        ticketingEnabled
        isHighDemand
        isComingSoon
        tickets {
          _id
          ticketName
          ticketCategory
          ticketCapacity
          ticketSold
          ticketPrice
          markAsComingSoon
          markAsOnGroundOnly
          ticketVisible
        }
      }
      total
      page
      pageSize
    }
  }
`;

export const PUBLIC_EVENT_BY_SLUG_QUERY = `
  query GetPublicEventBySlug($slug: String!) {
    getPublicEventBySlug(slug: $slug) {
      _id
      title
      slug
      description
      eventFlyer
      horizontalFlyer
      videoSneakPeek
      gallery {
        url
        type
      }
      eventType
      startDate
      endDate
      city
      cityId
      genreTagIds
      location {
        addressLine1
        addressLine2
        city
        state
        pincode
        formattedAddress
        place {
          placeId
          displayName
        }
        coordinate { type coordinates }
      }
      ticketingTerms
      refundPolicy
      cancellationPolicy
      eventGuide {
        languageIds
        minimumEntryAge
        paidEntryAge
        venueLayout
        seatingArrangement
        kidFriendly
        petFriendly
        gatesOpenBeforeEvent
        gatesOpenLeadHours
        gatesOpenLeadMinutes
        youtubeLink
      }
      faqs {
        question
        answer
      }
      eventInstructions
      prohibitedItems
      ticketingEnabled
      isHighDemand
      tickets {
        _id
        ticketName
        ticketCategory
        ticketType
        ticketCapacity
        ticketSold
        ticketPrice
        ticketInfo
        maxTicketPerUser
        ticketGST
        gstRate
        markAsComingSoon
        markAsOnGroundOnly
        ticketVisible
      }
      extras {
        _id
        name
        description
        price
        quantity
        sold
        image
        type
      }
    }
  }
`;

/**
 * Lineup + organizer + collaborators for the event detail page.
 * Server resolves lineup → Artist (real) | PhantomArtist (stand-in) |
 * free-text fallback, and stitches host + collaborator Host rows into
 * an ordered list (primary host first, then collaborators).
 */
export const PUBLIC_EVENT_PEOPLE_QUERY = `
  query GetPublicEventPeople($eventId: String!) {
    getPublicEventPeople(eventId: $eventId) {
      artists {
        _id
        name
        picture
        tagline
        bio
        slug
        instagramLink
        spotifyLink
        youtubeLink
        isPhantom
      }
      organizers {
        _id
        name
        logo
        description
        city
        isPrimary
      }
    }
  }
`;

// Event-detail fetch used by the order-detail page. Originally a slim
// summary for AUDIT-031 (title/date/venue beside QR) + AUDIT-034
// disclosure, now expanded to power Lineup / When&Where / Things to
// know cards alongside the ticket — the order page is the customer's
// post-purchase reference, so it surfaces the same context they saw
// when booking instead of just the title.
export const PUBLIC_EVENT_SUMMARY_BY_ID_QUERY = `
  query GetPublicEventSummaryById($id: String!) {
    getPublicEventById(id: $id) {
      _id
      title
      slug
      eventFlyer
      horizontalFlyer
      startDate
      endDate
      city
      description
      location {
        addressLine1
        addressLine2
        city
        state
        pincode
        formattedAddress
        coordinate { type coordinates }
      }
      refundPolicy
      eventGuide {
        languageIds
        minimumEntryAge
        paidEntryAge
        venueLayout
        seatingArrangement
        kidFriendly
        petFriendly
        gatesOpenBeforeEvent
        gatesOpenLeadHours
        gatesOpenLeadMinutes
      }
      eventInstructions
      prohibitedItems
    }
  }
`;

export const ACTIVE_CITIES_QUERY = `
  query ActiveCities {
    getActiveIndianCities {
      _id
      value
      cityId
      city
      district
      state
    }
  }
`;

export const ACTIVE_CITIES_WITH_COORDS_QUERY = `
  query ActiveCitiesWithCoords {
    getActiveIndianCities {
      _id
      value
      cityId
      city
      district
      state
      latitude
      longitude
    }
  }
`;

export const ACTIVE_GENRE_TAGS_QUERY = `
  query ActiveGenreTags {
    getActiveGenreTags {
      _id
      value
    }
  }
`;

export const ACTIVE_LANGUAGES_QUERY = `
  query ActiveLanguages {
    getActiveLanguages {
      _id
      value
      code
      nativeName
    }
  }
`;

export const ACTIVE_PROHIBITED_ITEMS_QUERY = `
  query ActiveProhibitedItems {
    getActiveProhibitedItems {
      _id
      value
      slug
    }
  }
`;

export const ACTIVE_EVENT_CATEGORIES_QUERY = `
  query ActiveEventCategories {
    getActiveEventCategories {
      _id
      value
    }
  }
`;

// --- Auth ---

export const REQUEST_OTP_MUTATION = `
  mutation CustomerRequestOtp($input: CustomerOtpRequestInput!) {
    customerRequestOtp(input: $input) {
      otpId
      profileRequired
    }
  }
`;

export const VERIFY_OTP_MUTATION = `
  mutation CustomerVerifyOtp($input: CustomerOtpVerifyInput!) {
    customerVerifyOtp(input: $input) {
      customerId
      accessToken
      refreshToken
    }
  }
`;

export const GOOGLE_START_MUTATION = `
  mutation CustomerGoogleStart($input: CustomerGoogleStartInput!) {
    customerGoogleStart(input: $input) {
      outcome
      customerId
      accessToken
      refreshToken
      uniqueId
      pendingToken
      prefill {
        email
        firstName
        lastName
        picture
      }
    }
  }
`;

export const APPLE_START_MUTATION = `
  mutation CustomerAppleStart($input: CustomerAppleStartInput!) {
    customerAppleStart(input: $input) {
      outcome
      customerId
      accessToken
      refreshToken
      uniqueId
    }
  }
`;

export const PENDING_SIGNUP_REQUEST_OTP_MUTATION = `
  mutation CustomerPendingSignupRequestOtp(
    $input: CustomerPendingSignupRequestOtpInput!
  ) {
    customerPendingSignupRequestOtp(input: $input) {
      otpId
    }
  }
`;

export const PENDING_SIGNUP_VERIFY_OTP_MUTATION = `
  mutation CustomerPendingSignupVerifyOtp(
    $input: CustomerPendingSignupVerifyOtpInput!
  ) {
    customerPendingSignupVerifyOtp(input: $input) {
      outcome
      customerId
      accessToken
      refreshToken
      uniqueId
      primaryEmailMasked
      secondaryEmail
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation CustomerLogout {
    customerLogout
  }
`;

export const MY_PROFILE_QUERY = `
  query MyProfile {
    getMyProfile {
      _id
      firstName
      lastName
      email
      secondaryEmail
      phone
      city
      profilePic
      googleConnected
      appleConnected
      signupProvider
      birthdate
      gender
      emailMarketingOptIn
      smsMarketingOptIn
      whatsappMarketingOptIn
      pushNotificationMarketingOptIn
      address {
        addressLine1
        addressLine2
        city
        state
        pincode
        formattedAddress
        coordinate { type coordinates }
      }
    }
  }
`;

export const UPDATE_MY_PROFILE_MUTATION = `
  mutation UpdateMyProfile($input: UpdateCustomerProfileInput!) {
    updateMyProfile(input: $input) {
      _id
      firstName
      lastName
      email
      phone
      city
      profilePic
      birthdate
      gender
      emailMarketingOptIn
      smsMarketingOptIn
      whatsappMarketingOptIn
      pushNotificationMarketingOptIn
      address {
        addressLine1
        addressLine2
        city
        state
        pincode
        formattedAddress
        coordinate { type coordinates }
      }
    }
  }
`;

export const REGISTER_FCM_TOKEN_MUTATION = `
  mutation RegisterFcmToken($fcmToken: String!) {
    registerFcmToken(fcmToken: $fcmToken)
  }
`;

export const UNREGISTER_FCM_TOKEN_MUTATION = `
  mutation UnregisterFcmToken($fcmToken: String!) {
    unregisterFcmToken(fcmToken: $fcmToken)
  }
`;

// --- Address autocomplete (place search on /me/profile) ---
// Both queries are authenticated + per-customer rate-limited on the
// server (60 autocomplete + 20 detail calls per minute). See
// customer-server/src/modules/customerPlaces.
export const CUSTOMER_PLACES_AUTOCOMPLETE_QUERY = `
  query CustomerPlacesAutocomplete($input: String!) {
    customerPlacesAutocomplete(input: $input) {
      placeId
      displayName
    }
  }
`;

export const CUSTOMER_PLACE_DETAILS_QUERY = `
  query CustomerPlaceDetails($placeId: String!) {
    customerPlaceDetails(placeId: $placeId) {
      latitude
      longitude
      addressLine1
      addressLine2
      city
      state
      pincode
      formattedAddress
    }
  }
`;

// --- Instagram (customer connect + attendee row) ---
// The schema lives in customer-server/src/modules/customerInstagram.
// v1 ships against a stub fetcher; mutation/query shapes match the
// real Meta-backed path so the swap is callsite-only.

const INSTAGRAM_FIELDS = `
  _id
  customerId
  connected
  attendeeVisibility
  handle
  avatar
  biography
  followerCount
  mediaCount
  recentMedia {
    id
    caption
    mediaUrl
    thumbnailUrl
    permalink
    mediaType
    takenAt
  }
  city
  connectedAt
  lastSyncedAt
`;

export const GET_MY_INSTAGRAM_QUERY = `
  query GetMyInstagram {
    getMyInstagram {
      ${INSTAGRAM_FIELDS}
    }
  }
`;

export const CONNECT_INSTAGRAM_MUTATION = `
  mutation ConnectInstagram($input: ConnectInstagramInput!) {
    connectInstagram(input: $input) {
      ${INSTAGRAM_FIELDS}
    }
  }
`;

export const DISCONNECT_INSTAGRAM_MUTATION = `
  mutation DisconnectInstagram {
    disconnectInstagram
  }
`;

export const UPDATE_INSTAGRAM_VISIBILITY_MUTATION = `
  mutation UpdateInstagramVisibility($input: UpdateInstagramVisibilityInput!) {
    updateInstagramVisibility(input: $input) {
      ${INSTAGRAM_FIELDS}
    }
  }
`;

export const SYNC_MY_INSTAGRAM_MUTATION = `
  mutation SyncMyInstagram {
    syncMyInstagram {
      ${INSTAGRAM_FIELDS}
    }
  }
`;

export const GET_EVENT_ATTENDEES_WITH_INSTAGRAM_QUERY = `
  query GetEventAttendeesWithInstagram($eventId: String!, $limit: Int) {
    getEventAttendeesWithInstagram(eventId: $eventId, limit: $limit) {
      customerId
      firstName
      handle
      avatar
      city
    }
  }
`;

// --- Cart ---

const CART_FIELDS = `
  eventId
  tickets {
    ticketId
    ticketName
    quantity
    unitPrice
    totalPrice
  }
  extras {
    extraId
    extraName
    quantity
    unitPrice
    totalPrice
  }
  pricing {
    grossAmount
    applicationFee
    applicationFeePercent
    platformFeeGst
    taxes
    taxesPercent
    totalAmount
  }
  reservedAt
  expiresAt
`;

export const GET_CART_QUERY = `
  query GetCart($eventId: String!) {
    getCart(eventId: $eventId) {
      ${CART_FIELDS}
    }
  }
`;

export const SET_CART_MUTATION = `
  mutation SetCart($input: SetCartInput!) {
    setCart(input: $input) {
      ${CART_FIELDS}
    }
  }
`;

export const CLEAR_CART_MUTATION = `
  mutation ClearCart($eventId: String!) {
    clearCart(eventId: $eventId)
  }
`;

// --- Order ---

const ORDER_FIELDS = `
  _id
  eventId
  tickets {
    ticketTypeId
    ticketName
    quantity
    unitPrice
    totalPrice
  }
  extras {
    extraId
    extraName
    quantity
    unitPrice
    totalPrice
  }
  subtotal
  platformFee
  applicationFeePercent
  platformFeeGst
  taxes
  taxesPercent
  totalAmount
  orderStatus
  razorpayOrderId
  razorpayPaymentId
  qrCodeData
  checkedIn
  reservedAt
  createdAt
  refundRequestStatus
  refundRequestedAt
  refundRequestReason
`;

export const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        ${ORDER_FIELDS}
      }
      checkout {
        razorpayOrderId
        razorpayKeyId
        amount
        currency
        orderId
      }
    }
  }
`;

// AUDIT-030: resumes a PaymentPending order without minting a fresh
// Razorpay order — eliminates the double-capture risk when a customer
// abandons checkout mid-flow and returns later.
export const REUSE_PENDING_ORDER_MUTATION = `
  mutation ReusePendingOrder($orderId: String!) {
    reusePendingOrder(orderId: $orderId) {
      order {
        ${ORDER_FIELDS}
      }
      checkout {
        razorpayOrderId
        razorpayKeyId
        amount
        currency
        orderId
      }
    }
  }
`;

export const CONFIRM_PAYMENT_MUTATION = `
  mutation ConfirmOrderPayment(
    $razorpayOrderId: String!
    $razorpayPaymentId: String!
    $razorpaySignature: String!
  ) {
    confirmOrderPayment(
      razorpayOrderId: $razorpayOrderId
      razorpayPaymentId: $razorpayPaymentId
      razorpaySignature: $razorpaySignature
    ) {
      _id
      orderStatus
    }
  }
`;

export const MY_ORDERS_QUERY = `
  query MyOrders {
    getMyOrders {
      ${ORDER_FIELDS}
    }
  }
`;

export const MY_ORDER_BY_ID_QUERY = `
  query MyOrderById($orderId: String!) {
    getMyOrderById(orderId: $orderId) {
      ${ORDER_FIELDS}
    }
  }
`;

// Past + upcoming events linked to an artist or organiser — feeds the
// lineup/organizer mini-profile modal on the event detail page.
const PEOPLE_EVENTS_FIELDS = `
  _id
  title
  slug
  eventFlyer
  horizontalFlyer
  city
  startDate
`;

export const ARTIST_PAST_UPCOMING_EVENTS_QUERY = `
  query GetArtistPastUpcomingEvents($artistId: String!) {
    getArtistPastUpcomingEvents(artistId: $artistId) {
      upcoming { ${PEOPLE_EVENTS_FIELDS} }
      past { ${PEOPLE_EVENTS_FIELDS} }
    }
  }
`;

export const ORGANIZER_PAST_UPCOMING_EVENTS_QUERY = `
  query GetOrganizerPastUpcomingEvents($hostId: String!) {
    getOrganizerPastUpcomingEvents(hostId: $hostId) {
      upcoming { ${PEOPLE_EVENTS_FIELDS} }
      past { ${PEOPLE_EVENTS_FIELDS} }
    }
  }
`;

export const MY_ORDER_INVOICE_QUERY = `
  query GetMyOrderInvoice($orderId: String!) {
    getMyOrderInvoice(orderId: $orderId) {
      invoiceNumber
      pdfUrl
      expiresAt
      dateOfIssue
    }
  }
`;

export const REQUEST_ORDER_REFUND_MUTATION = `
  mutation RequestOrderRefund($orderId: String!, $reason: String!) {
    requestOrderRefund(orderId: $orderId, reason: $reason) {
      ${ORDER_FIELDS}
    }
  }
`;

// Artist merch orders the customer has placed. Lives in customer-server
// alongside event orders but on the `ArtistMerchOrder` collection.
export const MY_ARTIST_MERCH_ORDERS_QUERY = `
  query MyArtistMerchOrders {
    myArtistMerchOrders {
      _id
      itemName
      artistId
      merchId
      quantity
      unitPrice
      totalAmount
      currency
      status
      razorpayOrderId
      razorpayPaymentId
      shippingName
      shippingCity
      shippingPincode
      carrier
      trackingNumber
      shippedAt
      createdAt
      updatedAt
    }
  }
`;

// Artists the signed-in customer follows. This hits customer-server so the
// query lives alongside the other customer-authenticated reads here rather
// than in `artist-queries.ts` (which targets main-server public reads).
export const MY_FOLLOWED_ARTISTS_QUERY = `
  query MyFollowedArtists {
    myFollowedArtists {
      _id
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
  }
`;
