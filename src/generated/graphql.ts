import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTimeISO: { input: any; output: any; }
};

export type AddressInfo = {
  __typename?: 'AddressInfo';
  addressLine1?: Maybe<Scalars['String']['output']>;
  addressLine2?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  coordinate?: Maybe<CoordinatePoint>;
  formattedAddress?: Maybe<Scalars['String']['output']>;
  pincode?: Maybe<Scalars['String']['output']>;
  place?: Maybe<PlaceInfo>;
  state?: Maybe<Scalars['String']['output']>;
};

export type Admin = {
  __typename?: 'Admin';
  _id: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  email: Scalars['String']['output'];
  firstName?: Maybe<Scalars['String']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  role: AdminRole;
  status: AdminStatus;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export enum AdminRole {
  Admin = 'ADMIN',
  Master = 'MASTER',
  Normal = 'NORMAL',
  SuperAdmin = 'SUPER_ADMIN'
}

export enum AdminStatus {
  Active = 'ACTIVE',
  Blocked = 'BLOCKED'
}

export type AppleAuthData = {
  __typename?: 'AppleAuthData';
  connectedAt: Scalars['DateTimeISO']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type Artist = {
  __typename?: 'Artist';
  _id: Scalars['ID']['output'];
  appleMusicLink?: Maybe<Scalars['String']['output']>;
  authTokenVersion: Scalars['Int']['output'];
  bio?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  coverImage?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  genres?: Maybe<Array<Genre>>;
  instagramLink?: Maybe<Scalars['String']['output']>;
  isAdminVerified: Scalars['Boolean']['output'];
  isDeleted: Scalars['Boolean']['output'];
  isTemp: Scalars['Boolean']['output'];
  lastLoginAt?: Maybe<Scalars['DateTimeISO']['output']>;
  lastName: Scalars['String']['output'];
  merchStoreLink?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  profilePhoto?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  soundcloudLink?: Maybe<Scalars['String']['output']>;
  spotifyLink?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  status: ArtistStatus;
  tagline?: Maybe<Scalars['String']['output']>;
  totalFollowersCount: Scalars['Int']['output'];
  twitterLink?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  verificationStatus: ArtistVerificationStatus;
  youtubeLink?: Maybe<Scalars['String']['output']>;
};

export type ArtistFollow = {
  __typename?: 'ArtistFollow';
  _id: Scalars['ID']['output'];
  artistId: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  customerId: Scalars['String']['output'];
  followedAt: Scalars['DateTimeISO']['output'];
  isMuted: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type ArtistMerchCheckoutPayload = {
  __typename?: 'ArtistMerchCheckoutPayload';
  amount: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  orderId: Scalars['String']['output'];
  razorpayKeyId: Scalars['String']['output'];
  razorpayOrderId: Scalars['String']['output'];
};

export type ArtistMerchOrder = {
  __typename?: 'ArtistMerchOrder';
  _id: Scalars['ID']['output'];
  artistId: Scalars['String']['output'];
  carrier?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  currency: MerchCurrency;
  customerId: Scalars['String']['output'];
  isDeleted: Scalars['Boolean']['output'];
  itemName: Scalars['String']['output'];
  merchId: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  razorpayOrderId?: Maybe<Scalars['String']['output']>;
  razorpayPaymentId?: Maybe<Scalars['String']['output']>;
  razorpayRefundId?: Maybe<Scalars['String']['output']>;
  razorpaySignature?: Maybe<Scalars['String']['output']>;
  refundAmount?: Maybe<Scalars['Float']['output']>;
  refundedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  shippedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  shippingAddressLine1?: Maybe<Scalars['String']['output']>;
  shippingAddressLine2?: Maybe<Scalars['String']['output']>;
  shippingCity?: Maybe<Scalars['String']['output']>;
  shippingName?: Maybe<Scalars['String']['output']>;
  shippingPhone?: Maybe<Scalars['String']['output']>;
  shippingPincode?: Maybe<Scalars['String']['output']>;
  shippingState?: Maybe<Scalars['String']['output']>;
  status: ArtistMerchOrderStatus;
  totalAmount: Scalars['Float']['output'];
  trackingNumber?: Maybe<Scalars['String']['output']>;
  unitPrice: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export enum ArtistMerchOrderStatus {
  Cancelled = 'CANCELLED',
  Fulfilled = 'FULFILLED',
  PaymentFailed = 'PAYMENT_FAILED',
  PaymentPending = 'PAYMENT_PENDING',
  PaymentSuccess = 'PAYMENT_SUCCESS',
  Refunded = 'REFUNDED'
}

export type ArtistRequirements = {
  __typename?: 'ArtistRequirements';
  artistType?: Maybe<ArtistType>;
  budget?: Maybe<Scalars['Float']['output']>;
  experience?: Maybe<Scalars['String']['output']>;
  genres?: Maybe<Array<Genre>>;
};

export enum ArtistStatus {
  Active = 'ACTIVE',
  Banned = 'BANNED',
  PendingOtp = 'PENDING_OTP',
  PendingProfile = 'PENDING_PROFILE',
  Suspended = 'SUSPENDED'
}

export enum ArtistType {
  Band = 'BAND',
  Dj = 'DJ',
  Duo = 'DUO',
  Instrumentalist = 'INSTRUMENTALIST',
  Other = 'OTHER',
  Solo = 'SOLO',
  Vocalist = 'VOCALIST'
}

export enum ArtistVerificationStatus {
  Pending = 'PENDING',
  Rejected = 'REJECTED',
  Verified = 'VERIFIED'
}

export enum AudienceAvailability {
  InviteOnly = 'INVITE_ONLY',
  Public = 'PUBLIC'
}

export type CartExtraLine = {
  __typename?: 'CartExtraLine';
  extraId: Scalars['String']['output'];
  extraName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
};

export type CartExtraLineInput = {
  extraId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
};

export type CartPricing = {
  __typename?: 'CartPricing';
  applicationFee: Scalars['Float']['output'];
  applicationFeePercent: Scalars['Float']['output'];
  grossAmount: Scalars['Float']['output'];
  platformFeeGst: Scalars['Float']['output'];
  taxes: Scalars['Float']['output'];
  taxesPercent: Scalars['Float']['output'];
  totalAmount: Scalars['Float']['output'];
};

export type CartResponse = {
  __typename?: 'CartResponse';
  eventId: Scalars['String']['output'];
  expiresAt: Scalars['DateTimeISO']['output'];
  extras: Array<CartExtraLine>;
  pricing: CartPricing;
  reservedAt: Scalars['DateTimeISO']['output'];
  tickets: Array<CartTicketLine>;
};

export type CartTicketLine = {
  __typename?: 'CartTicketLine';
  quantity: Scalars['Int']['output'];
  ticketId: Scalars['String']['output'];
  ticketName: Scalars['String']['output'];
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
};

export type CartTicketLineInput = {
  quantity: Scalars['Int']['input'];
  ticketId: Scalars['String']['input'];
};

export type ConfirmArtistMerchPaymentInput = {
  razorpayOrderId: Scalars['String']['input'];
  razorpayPaymentId: Scalars['String']['input'];
  razorpaySignature: Scalars['String']['input'];
};

export type CoordinatePoint = {
  __typename?: 'CoordinatePoint';
  coordinates: Array<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
};

export enum CoverType {
  CoverWithoutDrink = 'COVER_WITHOUT_DRINK',
  CoverWithDrink = 'COVER_WITH_DRINK',
  DrinkCover = 'DRINK_COVER',
  FoodAndDrinkCover = 'FOOD_AND_DRINK_COVER',
  FoodCover = 'FOOD_COVER',
  FullCover = 'FULL_COVER',
  NoCover = 'NO_COVER'
}

export type CreateArtistMerchOrderInput = {
  merchId: Scalars['String']['input'];
  quantity: Scalars['Int']['input'];
  shippingAddressLine1?: InputMaybe<Scalars['String']['input']>;
  shippingAddressLine2?: InputMaybe<Scalars['String']['input']>;
  shippingCity?: InputMaybe<Scalars['String']['input']>;
  shippingName?: InputMaybe<Scalars['String']['input']>;
  shippingPhone?: InputMaybe<Scalars['String']['input']>;
  shippingPincode?: InputMaybe<Scalars['String']['input']>;
  shippingState?: InputMaybe<Scalars['String']['input']>;
};

export type CreateArtistMerchOrderResult = {
  __typename?: 'CreateArtistMerchOrderResult';
  checkout: ArtistMerchCheckoutPayload;
  order: ArtistMerchOrder;
};

export type CreateOrderInput = {
  eventId: Scalars['String']['input'];
  guestInfo?: InputMaybe<GuestInfoInput>;
  pageQuery?: InputMaybe<Scalars['String']['input']>;
  promoterId?: InputMaybe<Scalars['String']['input']>;
  referralCode?: InputMaybe<Scalars['String']['input']>;
  utm?: InputMaybe<UtmInput>;
};

export type CreateOrderResponse = {
  __typename?: 'CreateOrderResponse';
  checkout?: Maybe<RazorpayCheckoutPayload>;
  order: CustomerOrderView;
};

export type Customer = {
  __typename?: 'Customer';
  _id: Scalars['ID']['output'];
  appleConnected: Scalars['Boolean']['output'];
  appleData?: Maybe<AppleAuthData>;
  birthdate?: Maybe<Scalars['DateTimeISO']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  email: Scalars['String']['output'];
  emailMarketingOptIn: Scalars['Boolean']['output'];
  fcmTokens?: Maybe<Array<Scalars['String']['output']>>;
  firstName: Scalars['String']['output'];
  followingArtist?: Maybe<Array<FollowEntry>>;
  followingArtistNotInPlatform?: Maybe<Array<FollowEntry>>;
  followingBusiness?: Maybe<Array<FollowEntry>>;
  followingBusinessNotInPlatform?: Maybe<Array<FollowEntry>>;
  gender?: Maybe<Gender>;
  genrePreferences?: Maybe<Array<Genre>>;
  googleConnected: Scalars['Boolean']['output'];
  googleData?: Maybe<GoogleAuthData>;
  isDeleted: Scalars['Boolean']['output'];
  lastName: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  profilePic?: Maybe<Scalars['String']['output']>;
  pushNotificationMarketingOptIn: Scalars['Boolean']['output'];
  secondaryEmail?: Maybe<Scalars['String']['output']>;
  signupProvider: SignupProvider;
  smsMarketingOptIn: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  whatsappMarketingOptIn: Scalars['Boolean']['output'];
};

export type CustomerAppleStartInput = {
  idToken: Scalars['String']['input'];
};

export type CustomerAuthResponse = {
  __typename?: 'CustomerAuthResponse';
  accessToken: Scalars['String']['output'];
  customerId: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
};

export type CustomerGoogleStartInput = {
  idToken: Scalars['String']['input'];
};

export type CustomerGoogleStartResponse = {
  __typename?: 'CustomerGoogleStartResponse';
  accessToken?: Maybe<Scalars['String']['output']>;
  customerId?: Maybe<Scalars['String']['output']>;
  outcome: GoogleStartOutcome;
  pendingToken?: Maybe<Scalars['String']['output']>;
  prefill?: Maybe<GoogleStartPrefill>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  uniqueId?: Maybe<Scalars['String']['output']>;
};

export type CustomerOrderInvoice = {
  __typename?: 'CustomerOrderInvoice';
  dateOfIssue?: Maybe<Scalars['DateTimeISO']['output']>;
  expiresAt: Scalars['DateTimeISO']['output'];
  invoiceNumber: Scalars['String']['output'];
  pdfUrl: Scalars['String']['output'];
};

export type CustomerOrderView = {
  __typename?: 'CustomerOrderView';
  _id: Scalars['ID']['output'];
  applicationFeePercent: Scalars['Float']['output'];
  checkedIn: Scalars['Boolean']['output'];
  checkedInAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  eventId: Scalars['String']['output'];
  extras?: Maybe<Array<OrderExtraItem>>;
  guestInfo?: Maybe<GuestInfo>;
  orderStatus: OrderStatus;
  platformFee: Scalars['Float']['output'];
  platformFeeGst: Scalars['Float']['output'];
  qrCodeData?: Maybe<Scalars['String']['output']>;
  razorpayOrderId?: Maybe<Scalars['String']['output']>;
  razorpayPaymentId?: Maybe<Scalars['String']['output']>;
  refundRequestReason?: Maybe<Scalars['String']['output']>;
  refundRequestStatus?: Maybe<Scalars['String']['output']>;
  refundRequestedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  reservedAt: Scalars['DateTimeISO']['output'];
  subtotal: Scalars['Float']['output'];
  taxes: Scalars['Float']['output'];
  taxesPercent: Scalars['Float']['output'];
  tickets: Array<OrderTicketItem>;
  totalAmount: Scalars['Float']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
};

export type CustomerOtpRequestInput = {
  phone: Scalars['String']['input'];
};

export type CustomerOtpResponse = {
  __typename?: 'CustomerOtpResponse';
  otpId: Scalars['String']['output'];
  profileRequired: Scalars['Boolean']['output'];
};

export type CustomerOtpVerifyInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  otp: Scalars['String']['input'];
  otpId: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type CustomerPendingSignupRequestOtpInput = {
  pendingToken: Scalars['String']['input'];
  phone: Scalars['String']['input'];
};

export type CustomerPendingSignupRequestOtpResponse = {
  __typename?: 'CustomerPendingSignupRequestOtpResponse';
  otpId: Scalars['String']['output'];
};

export type CustomerPendingSignupVerifyOtpInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  otp: Scalars['String']['input'];
  pendingToken: Scalars['String']['input'];
};

export type CustomerPendingSignupVerifyOtpResponse = {
  __typename?: 'CustomerPendingSignupVerifyOtpResponse';
  accessToken: Scalars['String']['output'];
  customerId: Scalars['String']['output'];
  outcome: PendingSignupOutcome;
  primaryEmailMasked?: Maybe<Scalars['String']['output']>;
  refreshToken: Scalars['String']['output'];
  secondaryEmail?: Maybe<Scalars['String']['output']>;
  uniqueId: Scalars['String']['output'];
};

export type CustomerTokenRefreshResponse = {
  __typename?: 'CustomerTokenRefreshResponse';
  accessToken?: Maybe<Scalars['String']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum EntryAgeBand {
  Age_13Plus = 'AGE_13_PLUS',
  Age_16Plus = 'AGE_16_PLUS',
  Age_18Plus = 'AGE_18_PLUS',
  Age_21Plus = 'AGE_21_PLUS',
  Age_25Plus = 'AGE_25_PLUS',
  AllAges = 'ALL_AGES'
}

export type Event = {
  __typename?: 'Event';
  _id: Scalars['ID']['output'];
  adminPaused?: Maybe<Scalars['Boolean']['output']>;
  adminRating?: Maybe<Scalars['Float']['output']>;
  aiBoostFeePaidAt?: Maybe<Scalars['DateTimeISO']['output']>;
  aiBoostRazorpayOrderId?: Maybe<Scalars['String']['output']>;
  aiBoostRazorpayPaymentId?: Maybe<Scalars['String']['output']>;
  aiEvalAdminSummary?: Maybe<Scalars['String']['output']>;
  aiEvalRanAt?: Maybe<Scalars['DateTimeISO']['output']>;
  aiEvalSnapshot?: Maybe<Scalars['String']['output']>;
  aiPricingOptions?: Maybe<Array<EventPricingSnapshot>>;
  aiSelectedCommissionPct?: Maybe<Scalars['Float']['output']>;
  aiSelectedExtraAmount?: Maybe<Scalars['Float']['output']>;
  aiSelectedMarketingCreditAmount?: Maybe<Scalars['Float']['output']>;
  aiSelectedMarketingCreditDiscountPct?: Maybe<Scalars['Float']['output']>;
  aiSelectedUpfrontTriggerSellThroughPct?: Maybe<Scalars['Float']['output']>;
  aiShortSummary?: Maybe<Scalars['String']['output']>;
  allowWalkIns?: Maybe<Scalars['Boolean']['output']>;
  artistRequirements?: Maybe<ArtistRequirements>;
  assignedTagIds?: Maybe<Array<Scalars['String']['output']>>;
  audienceAvailability?: Maybe<AudienceAvailability>;
  autoConfirmBookings?: Maybe<Scalars['Boolean']['output']>;
  cancellationPolicy?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  cityId?: Maybe<Scalars['String']['output']>;
  collaboratorToBeAnnounced?: Maybe<Scalars['Boolean']['output']>;
  contactForQueriesTables?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdBy?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  draftedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  endDate?: Maybe<Scalars['DateTimeISO']['output']>;
  eventCategoryId?: Maybe<Scalars['String']['output']>;
  eventCollaborationBusiness?: Maybe<Array<EventBusinessPartner>>;
  eventFlyer?: Maybe<Scalars['String']['output']>;
  eventGuide?: Maybe<EventGuide>;
  eventInstructions?: Maybe<Array<Scalars['String']['output']>>;
  eventLocationDecided?: Maybe<Scalars['Boolean']['output']>;
  eventScore?: Maybe<Scalars['Float']['output']>;
  eventType?: Maybe<Array<EventType>>;
  expectedAudience?: Maybe<Scalars['Float']['output']>;
  expectedEventsDoneTillNow?: Maybe<Scalars['Float']['output']>;
  extras?: Maybe<Array<HoizrExtra>>;
  faqs?: Maybe<Array<EventFaq>>;
  feeSettlementMode?: Maybe<EventFeeSettlementMode>;
  firstSaleAt?: Maybe<Scalars['DateTimeISO']['output']>;
  firstStepCompleted: Scalars['Boolean']['output'];
  gallery?: Maybe<Array<EventGalleryItem>>;
  genreTagIds?: Maybe<Array<Scalars['String']['output']>>;
  genresPreferred?: Maybe<Array<Genre>>;
  horizontalFlyer?: Maybe<Scalars['String']['output']>;
  horizontalVideo?: Maybe<Scalars['String']['output']>;
  hostId: Scalars['String']['output'];
  instagramPost?: Maybe<Scalars['String']['output']>;
  instagramStory?: Maybe<Scalars['String']['output']>;
  internalRating?: Maybe<Scalars['Float']['output']>;
  isComingSoon?: Maybe<Scalars['Boolean']['output']>;
  isDeleted: Scalars['Boolean']['output'];
  isHighDemand?: Maybe<Scalars['Boolean']['output']>;
  isVisible?: Maybe<Scalars['Boolean']['output']>;
  lastSaleAt?: Maybe<Scalars['DateTimeISO']['output']>;
  lineUpToBeAnnounced?: Maybe<Scalars['Boolean']['output']>;
  lineup?: Maybe<Array<EventLineupArtist>>;
  location?: Maybe<AddressInfo>;
  lookingForArtist?: Maybe<Scalars['Boolean']['output']>;
  markSeparateDays?: Maybe<Scalars['Boolean']['output']>;
  maxCapacity?: Maybe<Scalars['Float']['output']>;
  offerDescription?: Maybe<Scalars['String']['output']>;
  paymentMethods?: Maybe<Array<Scalars['String']['output']>>;
  payoutProfile?: Maybe<Scalars['String']['output']>;
  payoutProfileId?: Maybe<Scalars['String']['output']>;
  popularityRating?: Maybe<Scalars['Float']['output']>;
  pricingSelectedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  pricingSnapshot?: Maybe<EventPricingSnapshot>;
  prohibitedItems?: Maybe<Array<Scalars['String']['output']>>;
  publishedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  refundPolicy?: Maybe<Scalars['String']['output']>;
  requiresIDVerification?: Maybe<Scalars['Boolean']['output']>;
  selectedAiBoostCode?: Maybe<Scalars['String']['output']>;
  selectedAiBoostGenerationId?: Maybe<Scalars['String']['output']>;
  selectedPricingPlan?: Maybe<EventPricingPlan>;
  seoSuggestions?: Maybe<Array<EventSeoSuggestion>>;
  showOffer?: Maybe<Scalars['Boolean']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  spellingMistakes?: Maybe<Array<EventSpellingMistake>>;
  startDate?: Maybe<Scalars['DateTimeISO']['output']>;
  status: EventStatus;
  tableLayoutImage?: Maybe<Scalars['String']['output']>;
  ticketSalesEndDate?: Maybe<Scalars['DateTimeISO']['output']>;
  ticketSalesStartDate?: Maybe<Scalars['DateTimeISO']['output']>;
  ticketingEnabled?: Maybe<Scalars['Boolean']['output']>;
  ticketingTerms?: Maybe<Scalars['String']['output']>;
  tickets?: Maybe<Array<EventTicket>>;
  title?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  verticalVideo?: Maybe<Scalars['String']['output']>;
  videoSneakPeek?: Maybe<Scalars['String']['output']>;
};

export type EventBusinessPartner = {
  __typename?: 'EventBusinessPartner';
  allowIssuingOfflineTickets?: Maybe<Scalars['Boolean']['output']>;
  businessLinkId?: Maybe<Scalars['String']['output']>;
  canCreateOffers?: Maybe<Scalars['Boolean']['output']>;
  canRunCampaigns?: Maybe<Scalars['Boolean']['output']>;
  canSeeMetrics?: Maybe<Scalars['Boolean']['output']>;
  collaborationStatus?: Maybe<EventCollabStatus>;
  createdBy?: Maybe<Scalars['String']['output']>;
  customerListShared?: Maybe<Scalars['Boolean']['output']>;
  hideOnEventPage?: Maybe<Scalars['Boolean']['output']>;
  invitedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  requestCustomerListAccess?: Maybe<Scalars['Boolean']['output']>;
  respondedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  sendTransactionalMails?: Maybe<Scalars['Boolean']['output']>;
  updatedBy?: Maybe<Scalars['String']['output']>;
};

export type EventCategory = {
  __typename?: 'EventCategory';
  _id: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdBy?: Maybe<Admin>;
  description?: Maybe<Scalars['String']['output']>;
  status: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  updatedBy?: Maybe<Admin>;
  value: Scalars['String']['output'];
};

export enum EventCollabStatus {
  Confirmed = 'CONFIRMED',
  Declined = 'DECLINED',
  Invited = 'INVITED'
}

export type EventFaq = {
  __typename?: 'EventFAQ';
  answer: Scalars['String']['output'];
  question: Scalars['String']['output'];
};

export enum EventFeeSettlementMode {
  DeductFromPayout = 'DEDUCT_FROM_PAYOUT',
  PayAfterEvent = 'PAY_AFTER_EVENT'
}

export type EventGalleryItem = {
  __typename?: 'EventGalleryItem';
  type: EventGalleryItemType;
  url: Scalars['String']['output'];
};

export enum EventGalleryItemType {
  Image = 'IMAGE',
  Video = 'VIDEO'
}

export type EventGuide = {
  __typename?: 'EventGuide';
  gatesOpenBeforeEvent?: Maybe<Scalars['Boolean']['output']>;
  gatesOpenLeadHours?: Maybe<Scalars['Float']['output']>;
  gatesOpenLeadMinutes?: Maybe<Scalars['Float']['output']>;
  kidFriendly?: Maybe<KidFriendlyPolicy>;
  languageIds?: Maybe<Array<Scalars['String']['output']>>;
  minimumEntryAge?: Maybe<EntryAgeBand>;
  paidEntryAge?: Maybe<EntryAgeBand>;
  petFriendly?: Maybe<PetFriendlyPolicy>;
  seatingArrangement?: Maybe<SeatingArrangement>;
  venueLayout?: Maybe<VenueLayout>;
  youtubeLink?: Maybe<Scalars['String']['output']>;
};

export type EventLineupArtist = {
  __typename?: 'EventLineupArtist';
  artistLinkId?: Maybe<Scalars['String']['output']>;
  instagramLink?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
  spotifyLink?: Maybe<Scalars['String']['output']>;
  tempArtistId?: Maybe<Scalars['String']['output']>;
  youtubeLink?: Maybe<Scalars['String']['output']>;
};

export enum EventOrganizerSegment {
  New = 'NEW',
  PowerHost = 'POWER_HOST',
  Regular = 'REGULAR'
}

export enum EventPricingPlan {
  HighRoller = 'HIGH_ROLLER',
  Saver = 'SAVER',
  ZeroUpfront = 'ZERO_UPFRONT'
}

export enum EventPricingRiskTier {
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type EventPricingSnapshot = {
  __typename?: 'EventPricingSnapshot';
  badge: Scalars['String']['output'];
  commissionRate: Scalars['Float']['output'];
  customerPlatformFeeRate: Scalars['Float']['output'];
  expectedGrossSales: Scalars['Float']['output'];
  expectedPaidTickets: Scalars['Float']['output'];
  hoizrGrossRevenue: Scalars['Float']['output'];
  hoizrNetContribution: Scalars['Float']['output'];
  hostPayout: Scalars['Float']['output'];
  label: Scalars['String']['output'];
  opsBuffer: Scalars['Float']['output'];
  optionId: Scalars['String']['output'];
  organizerSegment: EventOrganizerSegment;
  paymentGatewayCost: Scalars['Float']['output'];
  payoutCycleDaysMax: Scalars['Float']['output'];
  payoutCycleDaysMin: Scalars['Float']['output'];
  plan: EventPricingPlan;
  riskTier: EventPricingRiskTier;
  upfrontFee: Scalars['Float']['output'];
};

export type EventSeoSuggestion = {
  __typename?: 'EventSeoSuggestion';
  field: Scalars['String']['output'];
  severity: EventSeoSuggestionSeverity;
  suggestion: Scalars['String']['output'];
};

export enum EventSeoSuggestionSeverity {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

export type EventSpellingMistake = {
  __typename?: 'EventSpellingMistake';
  context?: Maybe<Scalars['String']['output']>;
  field: Scalars['String']['output'];
  suggestion?: Maybe<Scalars['String']['output']>;
  word: Scalars['String']['output'];
};

export enum EventStatus {
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Published = 'PUBLISHED'
}

export type EventTicket = {
  __typename?: 'EventTicket';
  _id: Scalars['ID']['output'];
  advanceBookingAmount?: Maybe<Scalars['Float']['output']>;
  collectPartialAdvancePayment?: Maybe<Scalars['Boolean']['output']>;
  coverAmount?: Maybe<Scalars['Float']['output']>;
  coverType?: Maybe<CoverType>;
  description?: Maybe<Scalars['String']['output']>;
  groupCapacity?: Maybe<Scalars['Float']['output']>;
  gstRate?: Maybe<Scalars['Float']['output']>;
  markAsComingSoon?: Maybe<Scalars['Boolean']['output']>;
  markAsOnGroundOnly?: Maybe<Scalars['Boolean']['output']>;
  maxTicketPerUser?: Maybe<Scalars['Float']['output']>;
  tableCapacity?: Maybe<Scalars['Float']['output']>;
  ticketCapacity: Scalars['Float']['output'];
  ticketCategory: TicketCategory;
  ticketExpiryDateTime?: Maybe<Scalars['DateTimeISO']['output']>;
  ticketGST?: Maybe<TicketGst>;
  ticketInfo?: Maybe<Scalars['String']['output']>;
  ticketName: Scalars['String']['output'];
  ticketPrice: Scalars['Float']['output'];
  ticketSold: Scalars['Float']['output'];
  ticketType?: Maybe<TicketType>;
  ticketVisible?: Maybe<Scalars['Boolean']['output']>;
};

export enum EventType {
  Exclusive = 'EXCLUSIVE',
  Free = 'FREE',
  NonExclusive = 'NON_EXCLUSIVE'
}

export type FollowEntry = {
  __typename?: 'FollowEntry';
  followedAt: Scalars['DateTimeISO']['output'];
  source: Scalars['String']['output'];
  targetId: Scalars['String']['output'];
};

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER',
  PreferNotToSay = 'PREFER_NOT_TO_SAY'
}

export enum Genre {
  Afro = 'AFRO',
  Afrobeat = 'AFROBEAT',
  AfroHouse = 'AFRO_HOUSE',
  Batida = 'BATIDA',
  Bollytech = 'BOLLYTECH',
  Bollywood = 'BOLLYWOOD',
  Comedy = 'COMEDY',
  Commercial = 'COMMERCIAL',
  Dancehall = 'DANCEHALL',
  DeepHouse = 'DEEP_HOUSE',
  Disco = 'DISCO',
  Dubstep = 'DUBSTEP',
  Edm = 'EDM',
  Electronic = 'ELECTRONIC',
  Garba = 'GARBA',
  Gqom = 'GQOM',
  Halloween = 'HALLOWEEN',
  HipHop = 'HIP_HOP',
  HiTech = 'HI_TECH',
  Hollywood = 'HOLLYWOOD',
  House = 'HOUSE',
  Indie = 'INDIE',
  Jazz = 'JAZZ',
  Jungle = 'JUNGLE',
  Kuduro = 'KUDURO',
  KPop = 'K_POP',
  Latin = 'LATIN',
  LiveMusic = 'LIVE_MUSIC',
  MelodicHouse = 'MELODIC_HOUSE',
  Metal = 'METAL',
  Minimal = 'MINIMAL',
  Pop = 'POP',
  Progressive = 'PROGRESSIVE',
  Psychedelic = 'PSYCHEDELIC',
  Punjabi = 'PUNJABI',
  Rap = 'RAP',
  Raves = 'RAVES',
  Reggae = 'REGGAE',
  Rock = 'ROCK',
  Soca = 'SOCA',
  Sports = 'SPORTS',
  Techno = 'TECHNO',
  Thumri = 'THUMRI'
}

export type GenreTag = {
  __typename?: 'GenreTag';
  _id: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdBy?: Maybe<Admin>;
  status: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  updatedBy?: Maybe<Admin>;
  value: Scalars['String']['output'];
};

export type GoogleAuthData = {
  __typename?: 'GoogleAuthData';
  connectedAt: Scalars['DateTimeISO']['output'];
  email?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

export enum GoogleStartOutcome {
  LinkedExistingByEmail = 'LINKED_EXISTING_BY_EMAIL',
  LoggedIn = 'LOGGED_IN',
  PendingPhoneRequired = 'PENDING_PHONE_REQUIRED'
}

export type GoogleStartPrefill = {
  __typename?: 'GoogleStartPrefill';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Scalars['String']['output']>;
};

export type GuestInfo = {
  __typename?: 'GuestInfo';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phone: Scalars['String']['output'];
};

export type GuestInfoInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phone: Scalars['String']['input'];
};

export type HoizrExtra = {
  __typename?: 'HoizrExtra';
  _id: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  linkedTicketTypes?: Maybe<Array<Scalars['String']['output']>>;
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
  quantity: Scalars['Float']['output'];
  sold: Scalars['Float']['output'];
  type: HoizrExtraType;
};

export enum HoizrExtraType {
  FoodDrink = 'FOOD_DRINK',
  MeetAndGreet = 'MEET_AND_GREET',
  Merch = 'MERCH',
  Other = 'OTHER',
  VipUpgrade = 'VIP_UPGRADE'
}

export type IndianCity = {
  __typename?: 'IndianCity';
  _id: Scalars['ID']['output'];
  city: Scalars['String']['output'];
  cityId: Scalars['String']['output'];
  district?: Maybe<Scalars['String']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  rank?: Maybe<Scalars['Float']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  status: Scalars['Boolean']['output'];
  value: Scalars['String']['output'];
};

export enum KidFriendlyPolicy {
  KidsNotAllowed = 'KIDS_NOT_ALLOWED',
  KidsWelcome = 'KIDS_WELCOME',
  KidsWithGuardian = 'KIDS_WITH_GUARDIAN'
}

export type LanguageMaster = {
  __typename?: 'LanguageMaster';
  _id: Scalars['ID']['output'];
  code: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdBy?: Maybe<Admin>;
  isIndian: Scalars['Boolean']['output'];
  nativeName?: Maybe<Scalars['String']['output']>;
  order: Scalars['Float']['output'];
  status: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  updatedBy?: Maybe<Admin>;
  value: Scalars['String']['output'];
};

export enum MerchCurrency {
  Inr = 'INR',
  Usd = 'USD'
}

export type Mutation = {
  __typename?: 'Mutation';
  clearCart: Scalars['Boolean']['output'];
  confirmArtistMerchPayment: ArtistMerchOrder;
  confirmOrderPayment: CustomerOrderView;
  createArtistMerchOrder: CreateArtistMerchOrderResult;
  createOrder: CreateOrderResponse;
  customerAppleStart: CustomerGoogleStartResponse;
  customerGoogleStart: CustomerGoogleStartResponse;
  customerLogout: Scalars['Boolean']['output'];
  customerPendingSignupRequestOtp: CustomerPendingSignupRequestOtpResponse;
  customerPendingSignupVerifyOtp: CustomerPendingSignupVerifyOtpResponse;
  customerRequestOtp: CustomerOtpResponse;
  customerTokenRefresh: CustomerTokenRefreshResponse;
  customerVerifyOtp: CustomerAuthResponse;
  followArtist: ArtistFollow;
  registerFcmToken: Scalars['Boolean']['output'];
  requestOrderRefund: CustomerOrderView;
  reusePendingOrder: CreateOrderResponse;
  scanTicket: ScanTicketResponse;
  scannerLogin: ScannerLoginResponse;
  scannerTokenRefresh: ScannerRefreshResponse;
  setCart: CartResponse;
  unfollowArtist: Scalars['Boolean']['output'];
  unregisterFcmToken: Scalars['Boolean']['output'];
  updateMyProfile: Customer;
};


export type MutationClearCartArgs = {
  eventId: Scalars['String']['input'];
};


export type MutationConfirmArtistMerchPaymentArgs = {
  input: ConfirmArtistMerchPaymentInput;
};


export type MutationConfirmOrderPaymentArgs = {
  razorpayOrderId: Scalars['String']['input'];
  razorpayPaymentId: Scalars['String']['input'];
  razorpaySignature: Scalars['String']['input'];
};


export type MutationCreateArtistMerchOrderArgs = {
  input: CreateArtistMerchOrderInput;
};


export type MutationCreateOrderArgs = {
  input: CreateOrderInput;
};


export type MutationCustomerAppleStartArgs = {
  input: CustomerAppleStartInput;
};


export type MutationCustomerGoogleStartArgs = {
  input: CustomerGoogleStartInput;
};


export type MutationCustomerPendingSignupRequestOtpArgs = {
  input: CustomerPendingSignupRequestOtpInput;
};


export type MutationCustomerPendingSignupVerifyOtpArgs = {
  input: CustomerPendingSignupVerifyOtpInput;
};


export type MutationCustomerRequestOtpArgs = {
  input: CustomerOtpRequestInput;
};


export type MutationCustomerVerifyOtpArgs = {
  input: CustomerOtpVerifyInput;
};


export type MutationFollowArtistArgs = {
  artistId: Scalars['String']['input'];
};


export type MutationRegisterFcmTokenArgs = {
  fcmToken: Scalars['String']['input'];
};


export type MutationRequestOrderRefundArgs = {
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};


export type MutationReusePendingOrderArgs = {
  orderId: Scalars['String']['input'];
};


export type MutationScanTicketArgs = {
  input: ScanTicketInput;
};


export type MutationScannerLoginArgs = {
  input: ScannerLoginInput;
};


export type MutationScannerTokenRefreshArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationSetCartArgs = {
  input: SetCartInput;
};


export type MutationUnfollowArtistArgs = {
  artistId: Scalars['String']['input'];
};


export type MutationUnregisterFcmTokenArgs = {
  fcmToken: Scalars['String']['input'];
};


export type MutationUpdateMyProfileArgs = {
  input: UpdateCustomerProfileInput;
};

export type MyOrdersFilterInput = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};

export type OrderExtraItem = {
  __typename?: 'OrderExtraItem';
  extraId: Scalars['String']['output'];
  extraName: Scalars['String']['output'];
  quantity: Scalars['Float']['output'];
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
};

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  CheckedIn = 'CHECKED_IN',
  PaymentFailed = 'PAYMENT_FAILED',
  PaymentPending = 'PAYMENT_PENDING',
  PaymentSuccess = 'PAYMENT_SUCCESS',
  Refunded = 'REFUNDED',
  Superseded = 'SUPERSEDED'
}

export type OrderTicketItem = {
  __typename?: 'OrderTicketItem';
  quantity: Scalars['Float']['output'];
  ticketName: Scalars['String']['output'];
  ticketTypeId: Scalars['String']['output'];
  totalPrice: Scalars['Float']['output'];
  unitPrice: Scalars['Float']['output'];
};

export enum PendingSignupOutcome {
  LinkedAsSecondary = 'LINKED_AS_SECONDARY',
  NewAccount = 'NEW_ACCOUNT'
}

export enum PetFriendlyPolicy {
  PetsNotAllowed = 'PETS_NOT_ALLOWED',
  PetsWelcome = 'PETS_WELCOME',
  ServiceAnimalsOnly = 'SERVICE_ANIMALS_ONLY'
}

export type PlaceInfo = {
  __typename?: 'PlaceInfo';
  displayName?: Maybe<Scalars['String']['output']>;
  placeId?: Maybe<Scalars['String']['output']>;
};

export type ProhibitedItemMaster = {
  __typename?: 'ProhibitedItemMaster';
  _id: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['DateTimeISO']['output']>;
  createdBy?: Maybe<Admin>;
  description?: Maybe<Scalars['String']['output']>;
  order: Scalars['Float']['output'];
  slug: Scalars['String']['output'];
  status: Scalars['Boolean']['output'];
  updatedAt?: Maybe<Scalars['DateTimeISO']['output']>;
  updatedBy?: Maybe<Admin>;
  value: Scalars['String']['output'];
};

export type PublicArtistOrOrganizerEvents = {
  __typename?: 'PublicArtistOrOrganizerEvents';
  past: Array<PublicEventSummary>;
  upcoming: Array<PublicEventSummary>;
};

export type PublicEventArtistEntry = {
  __typename?: 'PublicEventArtistEntry';
  _id?: Maybe<Scalars['String']['output']>;
  bio?: Maybe<Scalars['String']['output']>;
  instagramLink?: Maybe<Scalars['String']['output']>;
  isPhantom: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  picture?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  spotifyLink?: Maybe<Scalars['String']['output']>;
  tagline?: Maybe<Scalars['String']['output']>;
  youtubeLink?: Maybe<Scalars['String']['output']>;
};

export type PublicEventFilterInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  cityId?: InputMaybe<Scalars['String']['input']>;
  eventCategoryIds?: InputMaybe<Array<Scalars['String']['input']>>;
  genreTagIds?: InputMaybe<Array<Scalars['String']['input']>>;
  maxPrice?: InputMaybe<Scalars['Float']['input']>;
  minPrice?: InputMaybe<Scalars['Float']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  startDateFrom?: InputMaybe<Scalars['DateTimeISO']['input']>;
  startDateTo?: InputMaybe<Scalars['DateTimeISO']['input']>;
};

export type PublicEventOrganizerEntry = {
  __typename?: 'PublicEventOrganizerEntry';
  _id?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  isPrimary: Scalars['Boolean']['output'];
  logo?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type PublicEventPaginatedResponse = {
  __typename?: 'PublicEventPaginatedResponse';
  events: Array<Event>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type PublicEventPeopleResponse = {
  __typename?: 'PublicEventPeopleResponse';
  artists: Array<PublicEventArtistEntry>;
  organizers: Array<PublicEventOrganizerEntry>;
};

export type PublicEventSummary = {
  __typename?: 'PublicEventSummary';
  _id: Scalars['String']['output'];
  city?: Maybe<Scalars['String']['output']>;
  eventFlyer?: Maybe<Scalars['String']['output']>;
  horizontalFlyer?: Maybe<Scalars['String']['output']>;
  slug?: Maybe<Scalars['String']['output']>;
  startDate?: Maybe<Scalars['DateTimeISO']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  getActiveEventCategories: Array<EventCategory>;
  getActiveGenreTags: Array<GenreTag>;
  getActiveIndianCities: Array<IndianCity>;
  getActiveLanguages: Array<LanguageMaster>;
  getActiveProhibitedItems: Array<ProhibitedItemMaster>;
  getArtistPastUpcomingEvents: PublicArtistOrOrganizerEvents;
  getCart?: Maybe<CartResponse>;
  getMyOrderById?: Maybe<CustomerOrderView>;
  getMyOrderInvoice?: Maybe<CustomerOrderInvoice>;
  getMyOrders: Array<CustomerOrderView>;
  getMyProfile: Customer;
  getOrganizerPastUpcomingEvents: PublicArtistOrOrganizerEvents;
  getPublicEventById?: Maybe<Event>;
  getPublicEventBySlug?: Maybe<Event>;
  getPublicEventPeople: PublicEventPeopleResponse;
  getPublishedEvents: PublicEventPaginatedResponse;
  isFollowingArtist: Scalars['Boolean']['output'];
  myArtistMerchOrders: Array<ArtistMerchOrder>;
  myFollowedArtists: Array<Artist>;
  scannerEventSummary: ScannerEventSummary;
};


export type QueryGetArtistPastUpcomingEventsArgs = {
  artistId: Scalars['String']['input'];
};


export type QueryGetCartArgs = {
  eventId: Scalars['String']['input'];
};


export type QueryGetMyOrderByIdArgs = {
  orderId: Scalars['String']['input'];
};


export type QueryGetMyOrderInvoiceArgs = {
  orderId: Scalars['String']['input'];
};


export type QueryGetMyOrdersArgs = {
  input?: InputMaybe<MyOrdersFilterInput>;
};


export type QueryGetOrganizerPastUpcomingEventsArgs = {
  hostId: Scalars['String']['input'];
};


export type QueryGetPublicEventByIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetPublicEventBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryGetPublicEventPeopleArgs = {
  eventId: Scalars['String']['input'];
};


export type QueryGetPublishedEventsArgs = {
  input?: InputMaybe<PublicEventFilterInput>;
};


export type QueryIsFollowingArtistArgs = {
  artistId: Scalars['String']['input'];
};

export type RazorpayCheckoutPayload = {
  __typename?: 'RazorpayCheckoutPayload';
  amount: Scalars['Float']['output'];
  currency: Scalars['String']['output'];
  orderId: Scalars['String']['output'];
  razorpayKeyId: Scalars['String']['output'];
  razorpayOrderId: Scalars['String']['output'];
};

export enum ScanResultStatus {
  AlreadyCheckedIn = 'ALREADY_CHECKED_IN',
  Cancelled = 'CANCELLED',
  EventEnded = 'EVENT_ENDED',
  EventNotStarted = 'EVENT_NOT_STARTED',
  InvalidQr = 'INVALID_QR',
  Ok = 'OK',
  OrderNotFound = 'ORDER_NOT_FOUND',
  PaymentIncomplete = 'PAYMENT_INCOMPLETE',
  Refunded = 'REFUNDED',
  ScannerInactive = 'SCANNER_INACTIVE',
  WrongEvent = 'WRONG_EVENT'
}

export type ScanTicketInput = {
  qrCodeData: Scalars['String']['input'];
};

export type ScanTicketResponse = {
  __typename?: 'ScanTicketResponse';
  message: Scalars['String']['output'];
  order?: Maybe<ScannedOrderSummary>;
  status: ScanResultStatus;
};

export type ScannedExtraLine = {
  __typename?: 'ScannedExtraLine';
  extraName: Scalars['String']['output'];
  quantity: Scalars['Int']['output'];
};

export type ScannedOrderSummary = {
  __typename?: 'ScannedOrderSummary';
  checkedInAt: Scalars['DateTimeISO']['output'];
  customerName?: Maybe<Scalars['String']['output']>;
  customerPhone?: Maybe<Scalars['String']['output']>;
  extras?: Maybe<Array<ScannedExtraLine>>;
  orderId: Scalars['ID']['output'];
  previousCheckInAt?: Maybe<Scalars['DateTimeISO']['output']>;
  tickets: Array<ScannedTicketLine>;
  totalTickets: Scalars['Int']['output'];
};

export type ScannedTicketLine = {
  __typename?: 'ScannedTicketLine';
  quantity: Scalars['Int']['output'];
  ticketName: Scalars['String']['output'];
};

export type ScannerEventSummary = {
  __typename?: 'ScannerEventSummary';
  city?: Maybe<Scalars['String']['output']>;
  endDate?: Maybe<Scalars['DateTimeISO']['output']>;
  eventId: Scalars['ID']['output'];
  startDate?: Maybe<Scalars['DateTimeISO']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  totalScanned: Scalars['Int']['output'];
};

export type ScannerLoginInput = {
  accessCode: Scalars['String']['input'];
  email: Scalars['String']['input'];
};

export type ScannerLoginResponse = {
  __typename?: 'ScannerLoginResponse';
  accessToken: Scalars['String']['output'];
  businessId: Scalars['String']['output'];
  eventId: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  scannerId: Scalars['String']['output'];
  scannerName: Scalars['String']['output'];
  scannerType: Scalars['String']['output'];
};

export type ScannerRefreshResponse = {
  __typename?: 'ScannerRefreshResponse';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
};

export enum SeatingArrangement {
  Seated = 'SEATED',
  SeatedAndStanding = 'SEATED_AND_STANDING',
  Standing = 'STANDING'
}

export type SetCartInput = {
  eventId: Scalars['String']['input'];
  extras?: InputMaybe<Array<CartExtraLineInput>>;
  tickets: Array<CartTicketLineInput>;
};

/** How the customer first signed up — phone-OTP, Google, or Apple. */
export enum SignupProvider {
  Apple = 'APPLE',
  Google = 'GOOGLE',
  Phone = 'PHONE'
}

export enum TicketCategory {
  Backstage = 'BACKSTAGE',
  Entry = 'ENTRY',
  Group = 'GROUP',
  Guestlist = 'GUESTLIST',
  Normal = 'NORMAL',
  Table = 'TABLE',
  Vip = 'VIP'
}

export enum TicketGst {
  CgstSgst_18 = 'CGST_SGST_18',
  Igst_18 = 'IGST_18',
  None = 'NONE',
  Other = 'OTHER',
  Zero = 'ZERO'
}

export enum TicketType {
  Couple = 'COUPLE',
  Group = 'GROUP',
  Single = 'SINGLE',
  Table = 'TABLE'
}

export type UtmInput = {
  utmCampaign?: InputMaybe<Scalars['String']['input']>;
  utmContent?: InputMaybe<Scalars['String']['input']>;
  utmMedium?: InputMaybe<Scalars['String']['input']>;
  utmSource?: InputMaybe<Scalars['String']['input']>;
  utmTerm?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCustomerProfileInput = {
  birthdate?: InputMaybe<Scalars['DateTimeISO']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  emailMarketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  genrePreferences?: InputMaybe<Array<Genre>>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  profilePic?: InputMaybe<Scalars['String']['input']>;
  pushNotificationMarketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  smsMarketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
  whatsappMarketingOptIn?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum VenueLayout {
  Indoor = 'INDOOR',
  Mixed = 'MIXED',
  Outdoor = 'OUTDOOR'
}

export type CustomerRequestOtpMutationVariables = Exact<{
  input: CustomerOtpRequestInput;
}>;


export type CustomerRequestOtpMutation = { __typename?: 'Mutation', customerRequestOtp: { __typename?: 'CustomerOtpResponse', otpId: string, profileRequired: boolean } };

export type CustomerVerifyOtpMutationVariables = Exact<{
  input: CustomerOtpVerifyInput;
}>;


export type CustomerVerifyOtpMutation = { __typename?: 'Mutation', customerVerifyOtp: { __typename?: 'CustomerAuthResponse', customerId: string, accessToken: string, refreshToken: string } };

export type CustomerGoogleStartMutationVariables = Exact<{
  input: CustomerGoogleStartInput;
}>;


export type CustomerGoogleStartMutation = { __typename?: 'Mutation', customerGoogleStart: { __typename?: 'CustomerGoogleStartResponse', outcome: GoogleStartOutcome, customerId?: string | null, accessToken?: string | null, refreshToken?: string | null, uniqueId?: string | null, pendingToken?: string | null, prefill?: { __typename?: 'GoogleStartPrefill', email?: string | null, firstName?: string | null, lastName?: string | null, picture?: string | null } | null } };

export type CustomerAppleStartMutationVariables = Exact<{
  input: CustomerAppleStartInput;
}>;


export type CustomerAppleStartMutation = { __typename?: 'Mutation', customerAppleStart: { __typename?: 'CustomerGoogleStartResponse', outcome: GoogleStartOutcome, customerId?: string | null, accessToken?: string | null, refreshToken?: string | null, uniqueId?: string | null } };

export type CustomerPendingSignupRequestOtpMutationVariables = Exact<{
  input: CustomerPendingSignupRequestOtpInput;
}>;


export type CustomerPendingSignupRequestOtpMutation = { __typename?: 'Mutation', customerPendingSignupRequestOtp: { __typename?: 'CustomerPendingSignupRequestOtpResponse', otpId: string } };

export type CustomerPendingSignupVerifyOtpMutationVariables = Exact<{
  input: CustomerPendingSignupVerifyOtpInput;
}>;


export type CustomerPendingSignupVerifyOtpMutation = { __typename?: 'Mutation', customerPendingSignupVerifyOtp: { __typename?: 'CustomerPendingSignupVerifyOtpResponse', outcome: PendingSignupOutcome, customerId: string, accessToken: string, refreshToken: string, uniqueId: string, primaryEmailMasked?: string | null, secondaryEmail?: string | null } };

export type CustomerLogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type CustomerLogoutMutation = { __typename?: 'Mutation', customerLogout: boolean };

export type CartFieldsFragment = { __typename?: 'CartResponse', eventId: string, reservedAt: any, expiresAt: any, tickets: Array<{ __typename?: 'CartTicketLine', ticketId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras: Array<{ __typename?: 'CartExtraLine', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }>, pricing: { __typename?: 'CartPricing', grossAmount: number, applicationFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number } };

export type GetCartQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type GetCartQuery = { __typename?: 'Query', getCart?: { __typename?: 'CartResponse', eventId: string, reservedAt: any, expiresAt: any, tickets: Array<{ __typename?: 'CartTicketLine', ticketId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras: Array<{ __typename?: 'CartExtraLine', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }>, pricing: { __typename?: 'CartPricing', grossAmount: number, applicationFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number } } | null };

export type SetCartMutationVariables = Exact<{
  input: SetCartInput;
}>;


export type SetCartMutation = { __typename?: 'Mutation', setCart: { __typename?: 'CartResponse', eventId: string, reservedAt: any, expiresAt: any, tickets: Array<{ __typename?: 'CartTicketLine', ticketId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras: Array<{ __typename?: 'CartExtraLine', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }>, pricing: { __typename?: 'CartPricing', grossAmount: number, applicationFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number } } };

export type ClearCartMutationVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type ClearCartMutation = { __typename?: 'Mutation', clearCart: boolean };

export type GetPublishedEventsQueryVariables = Exact<{
  input?: InputMaybe<PublicEventFilterInput>;
}>;


export type GetPublishedEventsQuery = { __typename?: 'Query', getPublishedEvents: { __typename?: 'PublicEventPaginatedResponse', total: number, page: number, pageSize: number, events: Array<{ __typename?: 'Event', _id: string, title?: string | null, slug?: string | null, description?: string | null, eventFlyer?: string | null, horizontalFlyer?: string | null, videoSneakPeek?: string | null, eventType?: Array<EventType> | null, startDate?: any | null, endDate?: any | null, city?: string | null, cityId?: string | null, genreTagIds?: Array<string> | null, ticketingEnabled?: boolean | null, isHighDemand?: boolean | null, isComingSoon?: boolean | null, tickets?: Array<{ __typename?: 'EventTicket', _id: string, ticketName: string, ticketCategory: TicketCategory, ticketCapacity: number, ticketSold: number, ticketPrice: number, markAsComingSoon?: boolean | null, markAsOnGroundOnly?: boolean | null, ticketVisible?: boolean | null }> | null }> } };

export type GetPublicEventBySlugQueryVariables = Exact<{
  slug: Scalars['String']['input'];
}>;


export type GetPublicEventBySlugQuery = { __typename?: 'Query', getPublicEventBySlug?: { __typename?: 'Event', _id: string, title?: string | null, slug?: string | null, description?: string | null, eventFlyer?: string | null, horizontalFlyer?: string | null, videoSneakPeek?: string | null, eventType?: Array<EventType> | null, startDate?: any | null, endDate?: any | null, city?: string | null, cityId?: string | null, genreTagIds?: Array<string> | null, ticketingTerms?: string | null, refundPolicy?: string | null, cancellationPolicy?: string | null, eventInstructions?: Array<string> | null, prohibitedItems?: Array<string> | null, ticketingEnabled?: boolean | null, isHighDemand?: boolean | null, gallery?: Array<{ __typename?: 'EventGalleryItem', url: string, type: EventGalleryItemType }> | null, location?: { __typename?: 'AddressInfo', addressLine1?: string | null, addressLine2?: string | null, city?: string | null, state?: string | null, pincode?: string | null, formattedAddress?: string | null, place?: { __typename?: 'PlaceInfo', placeId?: string | null, displayName?: string | null } | null } | null, eventGuide?: { __typename?: 'EventGuide', languageIds?: Array<string> | null, minimumEntryAge?: EntryAgeBand | null, paidEntryAge?: EntryAgeBand | null, venueLayout?: VenueLayout | null, seatingArrangement?: SeatingArrangement | null, kidFriendly?: KidFriendlyPolicy | null, petFriendly?: PetFriendlyPolicy | null, gatesOpenBeforeEvent?: boolean | null, gatesOpenLeadHours?: number | null, gatesOpenLeadMinutes?: number | null, youtubeLink?: string | null } | null, faqs?: Array<{ __typename?: 'EventFAQ', question: string, answer: string }> | null, tickets?: Array<{ __typename?: 'EventTicket', _id: string, ticketName: string, ticketCategory: TicketCategory, ticketType?: TicketType | null, ticketCapacity: number, ticketSold: number, ticketPrice: number, ticketInfo?: string | null, maxTicketPerUser?: number | null, ticketGST?: TicketGst | null, gstRate?: number | null, markAsComingSoon?: boolean | null, markAsOnGroundOnly?: boolean | null, ticketVisible?: boolean | null }> | null, extras?: Array<{ __typename?: 'HoizrExtra', _id: string, name: string, description?: string | null, price: number, quantity: number, sold: number, image?: string | null, type: HoizrExtraType }> | null } | null };

export type GetPublicEventPeopleQueryVariables = Exact<{
  eventId: Scalars['String']['input'];
}>;


export type GetPublicEventPeopleQuery = { __typename?: 'Query', getPublicEventPeople: { __typename?: 'PublicEventPeopleResponse', artists: Array<{ __typename?: 'PublicEventArtistEntry', _id?: string | null, name: string, picture?: string | null, tagline?: string | null, bio?: string | null, slug?: string | null, instagramLink?: string | null, spotifyLink?: string | null, youtubeLink?: string | null, isPhantom: boolean }>, organizers: Array<{ __typename?: 'PublicEventOrganizerEntry', _id?: string | null, name: string, logo?: string | null, description?: string | null, city?: string | null, isPrimary: boolean }> } };

export type GetPublicEventSummaryByIdQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type GetPublicEventSummaryByIdQuery = { __typename?: 'Query', getPublicEventById?: { __typename?: 'Event', _id: string, title?: string | null, slug?: string | null, startDate?: any | null, endDate?: any | null, city?: string | null, refundPolicy?: string | null, location?: { __typename?: 'AddressInfo', addressLine1?: string | null, city?: string | null, state?: string | null, formattedAddress?: string | null } | null } | null };

export type ActiveCitiesQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveCitiesQuery = { __typename?: 'Query', getActiveIndianCities: Array<{ __typename?: 'IndianCity', _id: string, value: string, cityId: string, city: string, district?: string | null, state?: string | null }> };

export type ActiveCitiesWithCoordsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveCitiesWithCoordsQuery = { __typename?: 'Query', getActiveIndianCities: Array<{ __typename?: 'IndianCity', _id: string, value: string, cityId: string, city: string, district?: string | null, state?: string | null, latitude?: number | null, longitude?: number | null }> };

export type ActiveGenreTagsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveGenreTagsQuery = { __typename?: 'Query', getActiveGenreTags: Array<{ __typename?: 'GenreTag', _id: string, value: string }> };

export type ActiveLanguagesQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveLanguagesQuery = { __typename?: 'Query', getActiveLanguages: Array<{ __typename?: 'LanguageMaster', _id: string, value: string, code: string, nativeName?: string | null }> };

export type ActiveProhibitedItemsQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveProhibitedItemsQuery = { __typename?: 'Query', getActiveProhibitedItems: Array<{ __typename?: 'ProhibitedItemMaster', _id: string, value: string, slug: string }> };

export type ActiveEventCategoriesQueryVariables = Exact<{ [key: string]: never; }>;


export type ActiveEventCategoriesQuery = { __typename?: 'Query', getActiveEventCategories: Array<{ __typename?: 'EventCategory', _id: string, value: string }> };

export type OrderFieldsFragment = { __typename?: 'CustomerOrderView', _id: string, eventId: string, subtotal: number, platformFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number, orderStatus: OrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, qrCodeData?: string | null, checkedIn: boolean, reservedAt: any, createdAt?: any | null, refundRequestStatus?: string | null, refundRequestedAt?: any | null, refundRequestReason?: string | null, tickets: Array<{ __typename?: 'OrderTicketItem', ticketTypeId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras?: Array<{ __typename?: 'OrderExtraItem', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }> | null };

export type CreateOrderMutationVariables = Exact<{
  input: CreateOrderInput;
}>;


export type CreateOrderMutation = { __typename?: 'Mutation', createOrder: { __typename?: 'CreateOrderResponse', order: { __typename?: 'CustomerOrderView', _id: string, eventId: string, subtotal: number, platformFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number, orderStatus: OrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, qrCodeData?: string | null, checkedIn: boolean, reservedAt: any, createdAt?: any | null, refundRequestStatus?: string | null, refundRequestedAt?: any | null, refundRequestReason?: string | null, tickets: Array<{ __typename?: 'OrderTicketItem', ticketTypeId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras?: Array<{ __typename?: 'OrderExtraItem', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }> | null }, checkout?: { __typename?: 'RazorpayCheckoutPayload', razorpayOrderId: string, razorpayKeyId: string, amount: number, currency: string, orderId: string } | null } };

export type ReusePendingOrderMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type ReusePendingOrderMutation = { __typename?: 'Mutation', reusePendingOrder: { __typename?: 'CreateOrderResponse', order: { __typename?: 'CustomerOrderView', _id: string, eventId: string, subtotal: number, platformFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number, orderStatus: OrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, qrCodeData?: string | null, checkedIn: boolean, reservedAt: any, createdAt?: any | null, refundRequestStatus?: string | null, refundRequestedAt?: any | null, refundRequestReason?: string | null, tickets: Array<{ __typename?: 'OrderTicketItem', ticketTypeId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras?: Array<{ __typename?: 'OrderExtraItem', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }> | null }, checkout?: { __typename?: 'RazorpayCheckoutPayload', razorpayOrderId: string, razorpayKeyId: string, amount: number, currency: string, orderId: string } | null } };

export type ConfirmOrderPaymentMutationVariables = Exact<{
  razorpayOrderId: Scalars['String']['input'];
  razorpayPaymentId: Scalars['String']['input'];
  razorpaySignature: Scalars['String']['input'];
}>;


export type ConfirmOrderPaymentMutation = { __typename?: 'Mutation', confirmOrderPayment: { __typename?: 'CustomerOrderView', _id: string, orderStatus: OrderStatus } };

export type MyOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type MyOrdersQuery = { __typename?: 'Query', getMyOrders: Array<{ __typename?: 'CustomerOrderView', _id: string, eventId: string, subtotal: number, platformFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number, orderStatus: OrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, qrCodeData?: string | null, checkedIn: boolean, reservedAt: any, createdAt?: any | null, refundRequestStatus?: string | null, refundRequestedAt?: any | null, refundRequestReason?: string | null, tickets: Array<{ __typename?: 'OrderTicketItem', ticketTypeId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras?: Array<{ __typename?: 'OrderExtraItem', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }> | null }> };

export type MyOrderByIdQueryVariables = Exact<{
  orderId: Scalars['String']['input'];
}>;


export type MyOrderByIdQuery = { __typename?: 'Query', getMyOrderById?: { __typename?: 'CustomerOrderView', _id: string, eventId: string, subtotal: number, platformFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number, orderStatus: OrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, qrCodeData?: string | null, checkedIn: boolean, reservedAt: any, createdAt?: any | null, refundRequestStatus?: string | null, refundRequestedAt?: any | null, refundRequestReason?: string | null, tickets: Array<{ __typename?: 'OrderTicketItem', ticketTypeId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras?: Array<{ __typename?: 'OrderExtraItem', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }> | null } | null };

export type RequestOrderRefundMutationVariables = Exact<{
  orderId: Scalars['String']['input'];
  reason: Scalars['String']['input'];
}>;


export type RequestOrderRefundMutation = { __typename?: 'Mutation', requestOrderRefund: { __typename?: 'CustomerOrderView', _id: string, eventId: string, subtotal: number, platformFee: number, applicationFeePercent: number, platformFeeGst: number, taxes: number, taxesPercent: number, totalAmount: number, orderStatus: OrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, qrCodeData?: string | null, checkedIn: boolean, reservedAt: any, createdAt?: any | null, refundRequestStatus?: string | null, refundRequestedAt?: any | null, refundRequestReason?: string | null, tickets: Array<{ __typename?: 'OrderTicketItem', ticketTypeId: string, ticketName: string, quantity: number, unitPrice: number, totalPrice: number }>, extras?: Array<{ __typename?: 'OrderExtraItem', extraId: string, extraName: string, quantity: number, unitPrice: number, totalPrice: number }> | null } };

export type MyArtistMerchOrdersQueryVariables = Exact<{ [key: string]: never; }>;


export type MyArtistMerchOrdersQuery = { __typename?: 'Query', myArtistMerchOrders: Array<{ __typename?: 'ArtistMerchOrder', _id: string, itemName: string, artistId: string, merchId: string, quantity: number, unitPrice: number, totalAmount: number, currency: MerchCurrency, status: ArtistMerchOrderStatus, razorpayOrderId?: string | null, razorpayPaymentId?: string | null, shippingName?: string | null, shippingCity?: string | null, shippingPincode?: string | null, carrier?: string | null, trackingNumber?: string | null, shippedAt?: any | null, createdAt?: any | null, updatedAt?: any | null }> };

export type MyFollowedArtistsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyFollowedArtistsQuery = { __typename?: 'Query', myFollowedArtists: Array<{ __typename?: 'Artist', _id: string, firstName: string, lastName: string, slug?: string | null, profilePhoto?: string | null, tagline?: string | null, city?: string | null, state?: string | null, genres?: Array<Genre> | null, totalFollowersCount: number }> };

export type MyProfileQueryVariables = Exact<{ [key: string]: never; }>;


export type MyProfileQuery = { __typename?: 'Query', getMyProfile: { __typename?: 'Customer', _id: string, firstName: string, lastName: string, email: string, secondaryEmail?: string | null, phone: string, city?: string | null, profilePic?: string | null, googleConnected: boolean, appleConnected: boolean, signupProvider: SignupProvider } };

export type UpdateMyProfileMutationVariables = Exact<{
  input: UpdateCustomerProfileInput;
}>;


export type UpdateMyProfileMutation = { __typename?: 'Mutation', updateMyProfile: { __typename?: 'Customer', _id: string, firstName: string, lastName: string, email: string, phone: string, city?: string | null, profilePic?: string | null } };

export type RegisterFcmTokenMutationVariables = Exact<{
  fcmToken: Scalars['String']['input'];
}>;


export type RegisterFcmTokenMutation = { __typename?: 'Mutation', registerFcmToken: boolean };

export type UnregisterFcmTokenMutationVariables = Exact<{
  fcmToken: Scalars['String']['input'];
}>;


export type UnregisterFcmTokenMutation = { __typename?: 'Mutation', unregisterFcmToken: boolean };

export const CartFieldsFragmentDoc = gql`
    fragment CartFields on CartResponse {
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
}
    `;
export const OrderFieldsFragmentDoc = gql`
    fragment OrderFields on CustomerOrderView {
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
}
    `;
export const CustomerRequestOtpDocument = gql`
    mutation CustomerRequestOtp($input: CustomerOtpRequestInput!) {
  customerRequestOtp(input: $input) {
    otpId
    profileRequired
  }
}
    `;
export const CustomerVerifyOtpDocument = gql`
    mutation CustomerVerifyOtp($input: CustomerOtpVerifyInput!) {
  customerVerifyOtp(input: $input) {
    customerId
    accessToken
    refreshToken
  }
}
    `;
export const CustomerGoogleStartDocument = gql`
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
export const CustomerAppleStartDocument = gql`
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
export const CustomerPendingSignupRequestOtpDocument = gql`
    mutation CustomerPendingSignupRequestOtp($input: CustomerPendingSignupRequestOtpInput!) {
  customerPendingSignupRequestOtp(input: $input) {
    otpId
  }
}
    `;
export const CustomerPendingSignupVerifyOtpDocument = gql`
    mutation CustomerPendingSignupVerifyOtp($input: CustomerPendingSignupVerifyOtpInput!) {
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
export const CustomerLogoutDocument = gql`
    mutation CustomerLogout {
  customerLogout
}
    `;
export const GetCartDocument = gql`
    query GetCart($eventId: String!) {
  getCart(eventId: $eventId) {
    ...CartFields
  }
}
    ${CartFieldsFragmentDoc}`;
export const SetCartDocument = gql`
    mutation SetCart($input: SetCartInput!) {
  setCart(input: $input) {
    ...CartFields
  }
}
    ${CartFieldsFragmentDoc}`;
export const ClearCartDocument = gql`
    mutation ClearCart($eventId: String!) {
  clearCart(eventId: $eventId)
}
    `;
export const GetPublishedEventsDocument = gql`
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
export const GetPublicEventBySlugDocument = gql`
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
export const GetPublicEventPeopleDocument = gql`
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
export const GetPublicEventSummaryByIdDocument = gql`
    query GetPublicEventSummaryById($id: String!) {
  getPublicEventById(id: $id) {
    _id
    title
    slug
    startDate
    endDate
    city
    location {
      addressLine1
      city
      state
      formattedAddress
    }
    refundPolicy
  }
}
    `;
export const ActiveCitiesDocument = gql`
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
export const ActiveCitiesWithCoordsDocument = gql`
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
export const ActiveGenreTagsDocument = gql`
    query ActiveGenreTags {
  getActiveGenreTags {
    _id
    value
  }
}
    `;
export const ActiveLanguagesDocument = gql`
    query ActiveLanguages {
  getActiveLanguages {
    _id
    value
    code
    nativeName
  }
}
    `;
export const ActiveProhibitedItemsDocument = gql`
    query ActiveProhibitedItems {
  getActiveProhibitedItems {
    _id
    value
    slug
  }
}
    `;
export const ActiveEventCategoriesDocument = gql`
    query ActiveEventCategories {
  getActiveEventCategories {
    _id
    value
  }
}
    `;
export const CreateOrderDocument = gql`
    mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    order {
      ...OrderFields
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
    ${OrderFieldsFragmentDoc}`;
export const ReusePendingOrderDocument = gql`
    mutation ReusePendingOrder($orderId: String!) {
  reusePendingOrder(orderId: $orderId) {
    order {
      ...OrderFields
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
    ${OrderFieldsFragmentDoc}`;
export const ConfirmOrderPaymentDocument = gql`
    mutation ConfirmOrderPayment($razorpayOrderId: String!, $razorpayPaymentId: String!, $razorpaySignature: String!) {
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
export const MyOrdersDocument = gql`
    query MyOrders {
  getMyOrders {
    ...OrderFields
  }
}
    ${OrderFieldsFragmentDoc}`;
export const MyOrderByIdDocument = gql`
    query MyOrderById($orderId: String!) {
  getMyOrderById(orderId: $orderId) {
    ...OrderFields
  }
}
    ${OrderFieldsFragmentDoc}`;
export const RequestOrderRefundDocument = gql`
    mutation RequestOrderRefund($orderId: String!, $reason: String!) {
  requestOrderRefund(orderId: $orderId, reason: $reason) {
    ...OrderFields
  }
}
    ${OrderFieldsFragmentDoc}`;
export const MyArtistMerchOrdersDocument = gql`
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
export const MyFollowedArtistsDocument = gql`
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
export const MyProfileDocument = gql`
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
  }
}
    `;
export const UpdateMyProfileDocument = gql`
    mutation UpdateMyProfile($input: UpdateCustomerProfileInput!) {
  updateMyProfile(input: $input) {
    _id
    firstName
    lastName
    email
    phone
    city
    profilePic
  }
}
    `;
export const RegisterFcmTokenDocument = gql`
    mutation RegisterFcmToken($fcmToken: String!) {
  registerFcmToken(fcmToken: $fcmToken)
}
    `;
export const UnregisterFcmTokenDocument = gql`
    mutation UnregisterFcmToken($fcmToken: String!) {
  unregisterFcmToken(fcmToken: $fcmToken)
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    CustomerRequestOtp(variables: CustomerRequestOtpMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerRequestOtpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerRequestOtpMutation>({ document: CustomerRequestOtpDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerRequestOtp', 'mutation', variables);
    },
    CustomerVerifyOtp(variables: CustomerVerifyOtpMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerVerifyOtpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerVerifyOtpMutation>({ document: CustomerVerifyOtpDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerVerifyOtp', 'mutation', variables);
    },
    CustomerGoogleStart(variables: CustomerGoogleStartMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerGoogleStartMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerGoogleStartMutation>({ document: CustomerGoogleStartDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerGoogleStart', 'mutation', variables);
    },
    CustomerAppleStart(variables: CustomerAppleStartMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerAppleStartMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerAppleStartMutation>({ document: CustomerAppleStartDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerAppleStart', 'mutation', variables);
    },
    CustomerPendingSignupRequestOtp(variables: CustomerPendingSignupRequestOtpMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerPendingSignupRequestOtpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerPendingSignupRequestOtpMutation>({ document: CustomerPendingSignupRequestOtpDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerPendingSignupRequestOtp', 'mutation', variables);
    },
    CustomerPendingSignupVerifyOtp(variables: CustomerPendingSignupVerifyOtpMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerPendingSignupVerifyOtpMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerPendingSignupVerifyOtpMutation>({ document: CustomerPendingSignupVerifyOtpDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerPendingSignupVerifyOtp', 'mutation', variables);
    },
    CustomerLogout(variables?: CustomerLogoutMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CustomerLogoutMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CustomerLogoutMutation>({ document: CustomerLogoutDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CustomerLogout', 'mutation', variables);
    },
    GetCart(variables: GetCartQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetCartQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetCartQuery>({ document: GetCartDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetCart', 'query', variables);
    },
    SetCart(variables: SetCartMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SetCartMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<SetCartMutation>({ document: SetCartDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SetCart', 'mutation', variables);
    },
    ClearCart(variables: ClearCartMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ClearCartMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ClearCartMutation>({ document: ClearCartDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ClearCart', 'mutation', variables);
    },
    GetPublishedEvents(variables?: GetPublishedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublishedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublishedEventsQuery>({ document: GetPublishedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublishedEvents', 'query', variables);
    },
    GetPublicEventBySlug(variables: GetPublicEventBySlugQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicEventBySlugQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicEventBySlugQuery>({ document: GetPublicEventBySlugDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicEventBySlug', 'query', variables);
    },
    GetPublicEventPeople(variables: GetPublicEventPeopleQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicEventPeopleQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicEventPeopleQuery>({ document: GetPublicEventPeopleDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicEventPeople', 'query', variables);
    },
    GetPublicEventSummaryById(variables: GetPublicEventSummaryByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPublicEventSummaryByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPublicEventSummaryByIdQuery>({ document: GetPublicEventSummaryByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPublicEventSummaryById', 'query', variables);
    },
    ActiveCities(variables?: ActiveCitiesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActiveCitiesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActiveCitiesQuery>({ document: ActiveCitiesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActiveCities', 'query', variables);
    },
    ActiveCitiesWithCoords(variables?: ActiveCitiesWithCoordsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActiveCitiesWithCoordsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActiveCitiesWithCoordsQuery>({ document: ActiveCitiesWithCoordsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActiveCitiesWithCoords', 'query', variables);
    },
    ActiveGenreTags(variables?: ActiveGenreTagsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActiveGenreTagsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActiveGenreTagsQuery>({ document: ActiveGenreTagsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActiveGenreTags', 'query', variables);
    },
    ActiveLanguages(variables?: ActiveLanguagesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActiveLanguagesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActiveLanguagesQuery>({ document: ActiveLanguagesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActiveLanguages', 'query', variables);
    },
    ActiveProhibitedItems(variables?: ActiveProhibitedItemsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActiveProhibitedItemsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActiveProhibitedItemsQuery>({ document: ActiveProhibitedItemsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActiveProhibitedItems', 'query', variables);
    },
    ActiveEventCategories(variables?: ActiveEventCategoriesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ActiveEventCategoriesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<ActiveEventCategoriesQuery>({ document: ActiveEventCategoriesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ActiveEventCategories', 'query', variables);
    },
    CreateOrder(variables: CreateOrderMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<CreateOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<CreateOrderMutation>({ document: CreateOrderDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'CreateOrder', 'mutation', variables);
    },
    ReusePendingOrder(variables: ReusePendingOrderMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ReusePendingOrderMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ReusePendingOrderMutation>({ document: ReusePendingOrderDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ReusePendingOrder', 'mutation', variables);
    },
    ConfirmOrderPayment(variables: ConfirmOrderPaymentMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<ConfirmOrderPaymentMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<ConfirmOrderPaymentMutation>({ document: ConfirmOrderPaymentDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'ConfirmOrderPayment', 'mutation', variables);
    },
    MyOrders(variables?: MyOrdersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyOrdersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyOrdersQuery>({ document: MyOrdersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyOrders', 'query', variables);
    },
    MyOrderById(variables: MyOrderByIdQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyOrderByIdQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyOrderByIdQuery>({ document: MyOrderByIdDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyOrderById', 'query', variables);
    },
    RequestOrderRefund(variables: RequestOrderRefundMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RequestOrderRefundMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RequestOrderRefundMutation>({ document: RequestOrderRefundDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RequestOrderRefund', 'mutation', variables);
    },
    MyArtistMerchOrders(variables?: MyArtistMerchOrdersQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyArtistMerchOrdersQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyArtistMerchOrdersQuery>({ document: MyArtistMerchOrdersDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyArtistMerchOrders', 'query', variables);
    },
    MyFollowedArtists(variables?: MyFollowedArtistsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyFollowedArtistsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyFollowedArtistsQuery>({ document: MyFollowedArtistsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyFollowedArtists', 'query', variables);
    },
    MyProfile(variables?: MyProfileQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<MyProfileQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<MyProfileQuery>({ document: MyProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'MyProfile', 'query', variables);
    },
    UpdateMyProfile(variables: UpdateMyProfileMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UpdateMyProfileMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UpdateMyProfileMutation>({ document: UpdateMyProfileDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UpdateMyProfile', 'mutation', variables);
    },
    RegisterFcmToken(variables: RegisterFcmTokenMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<RegisterFcmTokenMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<RegisterFcmTokenMutation>({ document: RegisterFcmTokenDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'RegisterFcmToken', 'mutation', variables);
    },
    UnregisterFcmToken(variables: UnregisterFcmTokenMutationVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<UnregisterFcmTokenMutation> {
      return withWrapper((wrappedRequestHeaders) => client.request<UnregisterFcmTokenMutation>({ document: UnregisterFcmTokenDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'UnregisterFcmToken', 'mutation', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;