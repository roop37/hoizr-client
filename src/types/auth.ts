export type CustomerAddress = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  formattedAddress?: string | null;
  /**
   * GeoJSON-style point matching `hoizr-shared` CoordinatePoint:
   * `coordinates` is `[lng, lat]`. Use `coordToLatLng()` to unpack.
   */
  coordinate?: {
    type?: string | null;
    coordinates?: number[] | null;
  } | null;
};

export type CustomerProfile = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  city?: string;
  profilePic?: string;
  googleConnected?: boolean;
  appleConnected?: boolean;
  signupProvider?: "PHONE" | "GOOGLE" | "APPLE";
  // Pulled fresh on /me/profile so the form can edit them. These are
  // optional because the legacy auth-store hydration via the typed
  // SDK (sdk.MyProfile) still uses the older selection set; the page
  // re-fetches via gqlRequest with the extended query to populate.
  birthdate?: string | null;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say" | null;
  emailMarketingOptIn?: boolean;
  smsMarketingOptIn?: boolean;
  whatsappMarketingOptIn?: boolean;
  pushNotificationMarketingOptIn?: boolean;
  /** Optional saved address powering distance badges + nearby sort. */
  address?: CustomerAddress | null;
};

export type GoogleStartOutcome =
  | "LOGGED_IN"
  | "LINKED_EXISTING_BY_EMAIL"
  | "PENDING_PHONE_REQUIRED";

export type PendingSignupOutcome = "NEW_ACCOUNT" | "LINKED_AS_SECONDARY";

export type GoogleStartPrefill = {
  email?: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
};

export type CustomerGoogleStartResponse = {
  outcome: GoogleStartOutcome;
  customerId?: string;
  accessToken?: string;
  refreshToken?: string;
  uniqueId?: string;
  pendingToken?: string;
  prefill?: GoogleStartPrefill;
};

export type CustomerPendingSignupVerifyResponse = {
  outcome: PendingSignupOutcome;
  customerId: string;
  accessToken: string;
  refreshToken: string;
  uniqueId: string;
  primaryEmailMasked?: string;
  secondaryEmail?: string;
};

// Stable error codes the server returns via ErrorWithProps `code`.
// Frontend keys collision modals + remediation copy on these — must
// match customer-server/src/modules/auth/interfaces/auth.errors.ts.
export const CustomerAuthErrorCode = {
  APPLE_NOT_CONFIGURED: "APPLE_NOT_CONFIGURED",
  INVALID_GOOGLE_TOKEN: "INVALID_GOOGLE_TOKEN",
  GOOGLE_EMAIL_NOT_VERIFIED: "GOOGLE_EMAIL_NOT_VERIFIED",
  PENDING_TOKEN_EXPIRED: "PENDING_TOKEN_EXPIRED",
  PHONE_ACCOUNT_FULL: "PHONE_ACCOUNT_FULL",
  EMAIL_USED_ELSEWHERE: "EMAIL_USED_ELSEWHERE",
  MISSING_REQUIRED_PROFILE_FIELDS: "MISSING_REQUIRED_PROFILE_FIELDS",
} as const;

export type CustomerAuthErrorCodeValue =
  (typeof CustomerAuthErrorCode)[keyof typeof CustomerAuthErrorCode];
