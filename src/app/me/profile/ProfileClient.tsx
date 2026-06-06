"use client";

import {
  AlertCircle,
  Apple,
  Camera,
  CheckCircle2,
  ChevronLeft,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CenteredLoader } from "@/components/ui/feedback";
import {
  AddressSearchCard,
  type CapturedAddress,
} from "@/components/hoizr-ui/AddressSearchCard";
import { InstagramConnectCard } from "@/components/hoizr-ui/InstagramConnectCard";
import { gqlRequest } from "@/lib/graphql";
import {
  MY_PROFILE_QUERY,
  UPDATE_MY_PROFILE_MUTATION,
} from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type { CustomerProfile } from "@/types/auth";
import { uploadCustomerAvatar } from "@/utils/cloudinaryUpload";

const GENDER_OPTIONS: Array<{
  value: NonNullable<CustomerProfile["gender"]> | "";
  label: string;
}> = [
  { value: "", label: "Prefer not to say" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const formatDateForInput = (iso?: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // <input type="date"> wants yyyy-mm-dd in local time.
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Build the `AddressInfoInput` payload from a `CapturedAddress` (or
 * `null` when the user cleared the saved address). Coords are sent
 * as a GeoJSON `CoordinatePointInput` (`[lng, lat]`) matching the
 * shape `hoizr-shared` defines.
 */
const buildAddressInput = (
  fields: CapturedAddress | null
): Record<string, unknown> | null => {
  if (!fields) return null;
  const payload: Record<string, unknown> = {};
  if (fields.addressLine1?.trim()) payload.addressLine1 = fields.addressLine1.trim();
  if (fields.addressLine2?.trim()) payload.addressLine2 = fields.addressLine2.trim();
  if (fields.city?.trim()) payload.city = fields.city.trim();
  if (fields.state?.trim()) payload.state = fields.state.trim();
  if (fields.pincode?.trim()) payload.pincode = fields.pincode.trim();
  if (fields.formattedAddress?.trim())
    payload.formattedAddress = fields.formattedAddress.trim();
  if (fields.coord) {
    payload.coordinate = {
      type: "Point",
      coordinates: [fields.coord.lng, fields.coord.lat],
    };
  }
  return Object.keys(payload).length ? payload : null;
};

export const ProfileClient = () => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const setProfile = useAuthStore((s) => s.setProfile);
  const logout = useAuthStore((s) => s.logout);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<
    NonNullable<CustomerProfile["gender"]> | ""
  >("");
  const [emailOpt, setEmailOpt] = useState(true);
  const [smsOpt, setSmsOpt] = useState(true);
  const [whatsappOpt, setWhatsappOpt] = useState(true);
  const [pushOpt, setPushOpt] = useState(true);

  // Address — optional. Single source of truth: a `CapturedAddress`
  // produced by the AddressSearchCard (Google Places, server-side
  // rate-limited). Manual line-by-line editing is intentionally gone;
  // the user picks a place and we persist the structured components
  // plus lat/lng as a GeoJSON point.
  const [savedAddress, setSavedAddress] = useState<CapturedAddress | null>(
    null
  );

  const [profilePic, setProfilePic] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !profile) {
      router.replace(
        `/login?next=${encodeURIComponent("/me/profile")}`
      );
    }
  }, [hydrated, profile, router]);

  // The legacy auth-store hydration uses the typed SDK whose selection
  // set is out of date until the next codegen run, so we re-fetch the
  // profile here with the extended query. This makes birthdate /
  // gender / marketing opt-ins available even before codegen runs.
  useEffect(() => {
    if (!profile) return;
    let mounted = true;
    setProfileLoading(true);
    gqlRequest<{ getMyProfile: CustomerProfile | null }>(MY_PROFILE_QUERY)
      .then((data) => {
        if (!mounted || !data.getMyProfile) return;
        setProfile(data.getMyProfile);
      })
      .catch(() => {
        // Fall back silently — `profile` already has the legacy fields.
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });
    return () => {
      mounted = false;
    };
    // Only on first arrival — re-fetching every render would clobber
    // the form while the user is editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id]);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setEmail(profile.email ?? "");
    setCity(profile.city ?? "");
    setProfilePic(profile.profilePic);
    setBirthdate(formatDateForInput(profile.birthdate));
    setGender(profile.gender ?? "");
    setEmailOpt(profile.emailMarketingOptIn !== false);
    setSmsOpt(profile.smsMarketingOptIn !== false);
    setWhatsappOpt(profile.whatsappMarketingOptIn !== false);
    setPushOpt(profile.pushNotificationMarketingOptIn !== false);
    const addr = profile.address ?? null;
    if (addr) {
      const coords = Array.isArray(addr.coordinate?.coordinates)
        ? addr.coordinate!.coordinates
        : null;
      const coord =
        coords && coords.length >= 2 &&
        typeof coords[0] === "number" &&
        typeof coords[1] === "number"
          ? { lng: coords[0], lat: coords[1] }
          : undefined;
      setSavedAddress({
        addressLine1: addr.addressLine1 ?? undefined,
        addressLine2: addr.addressLine2 ?? undefined,
        city: addr.city ?? undefined,
        state: addr.state ?? undefined,
        pincode: addr.pincode ?? undefined,
        formattedAddress: addr.formattedAddress ?? undefined,
        coord,
      });
    } else {
      setSavedAddress(null);
    }
  }, [profile]);

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (PNG, JPG, etc.)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image is too large — keep it under 8MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await uploadCustomerAvatar({
        customerId: profile._id,
        file,
      });
      await gqlRequest(UPDATE_MY_PROFILE_MUTATION, {
        input: { profilePic: result.secureUrl },
      });
      setProfilePic(result.secureUrl);
      // Refresh both the auth store and our local state so the new
      // picture survives navigation away.
      useAuthStore.setState({ hydrated: false });
      await hydrate();
    } catch (err: any) {
      setError(err?.message ?? "Profile picture upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError(null);
    setSavedTick(false);
    if (!firstName.trim() || !lastName.trim()) {
      setError("Add your first and last name so tickets address you correctly.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required so we can send booking confirmations.");
      return;
    }
    setSaving(true);
    try {
      const data = await gqlRequest<{ updateMyProfile: CustomerProfile }>(
        UPDATE_MY_PROFILE_MUTATION,
        {
          input: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            city: city.trim() || undefined,
            birthdate: birthdate ? new Date(birthdate).toISOString() : null,
            gender: gender || null,
            emailMarketingOptIn: emailOpt,
            smsMarketingOptIn: smsOpt,
            whatsappMarketingOptIn: whatsappOpt,
            pushNotificationMarketingOptIn: pushOpt,
            address: buildAddressInput(savedAddress),
          },
        }
      );
      // Patch the auth store with the new doc — saves a second
      // round-trip and keeps the rest of the app's header in sync.
      if (data.updateMyProfile) setProfile(data.updateMyProfile);
      setSavedTick(true);
      window.setTimeout(() => setSavedTick(false), 2500);
    } catch (err: any) {
      setError(
        err?.response?.errors?.[0]?.message ??
          err?.message ??
          "Could not save profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace("/");
  };

  const initials = useMemo(() => {
    const f = (profile?.firstName ?? "").charAt(0);
    const l = (profile?.lastName ?? "").charAt(0);
    return `${f}${l}`.toUpperCase();
  }, [profile?.firstName, profile?.lastName]);

  if (!hydrated || !profile) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <CenteredLoader label="Loading your profile…" />
      </div>
    );
  }

  const inputClass =
    "mt-1 h-11 w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-3 text-sm text-cream outline-none transition focus:border-[#c5ff3d]/60 focus:bg-cream/[0.06] placeholder:text-cream/40";
  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/60";
  const cardClass =
    "rounded-3xl border border-cream/10 bg-cream/[0.04] p-5 text-cream md:p-6";

  type ChannelKey = "email" | "sms" | "whatsapp" | "push";
  const channels: Array<{
    key: ChannelKey;
    title: string;
    sub: string;
    value: boolean;
    set: (next: boolean) => void;
  }> = [
    {
      key: "email",
      title: "Email updates",
      sub: "Order receipts always send. Toggles off announcements only.",
      value: emailOpt,
      set: setEmailOpt,
    },
    {
      key: "sms",
      title: "SMS reminders",
      sub: "Event-day reminders and last-minute changes.",
      value: smsOpt,
      set: setSmsOpt,
    },
    {
      key: "whatsapp",
      title: "WhatsApp",
      sub: "Same updates as SMS, on WhatsApp.",
      value: whatsappOpt,
      set: setWhatsappOpt,
    },
    {
      key: "push",
      title: "Push notifications",
      sub: "Pre-sale drops and curated picks for your city.",
      value: pushOpt,
      set: setPushOpt,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 text-cream md:py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-semibold text-cream/70 transition hover:text-cream"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
            <User size={14} />
            My profile
          </div>
          <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
            {profile.firstName || "Your account"}{" "}
            {profile.lastName ?? ""}
          </h1>
          <p className="mt-1 text-sm text-cream/65">
            Manage your details, picture, and what we&apos;re allowed to
            send you.
          </p>
        </div>
      </header>

      {/* Identity card — avatar, name, and immutable phone. */}
      <section className={`mt-6 ${cardClass}`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-cream/10 text-xl font-semibold text-cream ring-1 ring-inset ring-cream/15">
              {profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePic}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials || "?"}</span>
              )}
            </div>
            <button
              type="button"
              aria-label="Change profile picture"
              disabled={uploading}
              onClick={handlePickFile}
              className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-cream/15 bg-ink text-cream shadow-lg disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Camera size={14} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="min-w-0 text-sm">
            <div className="truncate font-semibold text-cream">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-cream/65">
              <Mail size={12} />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-cream/65">
              <Phone size={12} />
              <span>{profile.phone}</span>
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-cream/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/55">
                <ShieldCheck size={10} />
                Verified
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-cream/50">
          Phone is your sign-in identity and can&apos;t be changed here. If
          you&apos;ve moved numbers, reach{" "}
          <Link href="/support" className="underline">
            support
          </Link>
          .
        </p>
      </section>

      {/* Editable details */}
      <section className={`mt-4 ${cardClass}`}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
          Your details
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className={labelClass}>First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              placeholder="First name"
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              placeholder="Last name"
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </label>
          {profile.secondaryEmail ? (
            <div className="md:col-span-2 -mt-1 text-xs text-cream/55">
              Secondary email on file:{" "}
              <span className="font-medium text-cream/80">
                {profile.secondaryEmail}
              </span>
            </div>
          ) : null}
          <label className="block text-sm">
            <span className={labelClass}>City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
              placeholder="e.g. Mumbai"
            />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Birthdate</span>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className={inputClass}
              max={formatDateForInput(new Date().toISOString())}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className={labelClass}>Gender</span>
            <select
              value={gender}
              onChange={(e) =>
                setGender(
                  e.target.value as NonNullable<CustomerProfile["gender"]> | ""
                )
              }
              className={`${inputClass} appearance-none pr-8`}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option
                  key={opt.value || "unset"}
                  value={opt.value}
                  className="bg-ink text-cream"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {profile.googleConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
              <CheckCircle2 size={12} />
              Google connected
            </span>
          ) : null}
          {profile.appleConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
              <Apple size={12} />
              Apple connected
            </span>
          ) : null}
        </div>
      </section>

      {/* Saved address — search-only. User types, picks a Google
          place suggestion, we resolve to coords + structured fields.
          The component owns the input/chip rendering; the parent only
          owns the captured value. Auto-save fires when the user hits
          Save profile below. */}
      <div className="mt-4">
        <AddressSearchCard value={savedAddress} onChange={setSavedAddress} />
      </div>

      {/* Instagram connect — own card so the embedded media grid +
          visibility toggle has room and stays distinct from the
          marketing opt-ins below. */}
      <div className="mt-4">
        <InstagramConnectCard />
      </div>

      {/* Marketing opt-ins */}
      <section className={`mt-4 ${cardClass}`}>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cream/60">
          What we can send you
        </div>
        <ul className="mt-3 divide-y divide-cream/[0.06]">
          {channels.map((c) => (
            <li
              key={c.key}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-cream">
                  {c.title}
                </div>
                <div className="mt-0.5 text-xs text-cream/55">{c.sub}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={c.value}
                onClick={() => c.set(!c.value)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  c.value
                    ? "bg-[#c5ff3d]"
                    : "bg-cream/[0.12] ring-1 ring-inset ring-cream/15"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-ink shadow transition ${
                    c.value ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/[0.08] p-3 text-sm text-rose-200">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || profileLoading}
          onClick={save}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c5ff3d] px-5 text-sm font-semibold text-ink transition hover:bg-[#d9ff6e] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : savedTick ? (
            <>
              <CheckCircle2 size={16} /> Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
        <Link
          href="/support"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cream/15 px-4 text-sm font-semibold text-cream/85 transition hover:bg-cream/10"
        >
          <LifeBuoy size={16} />
          Get support
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cream/15 px-4 text-sm font-semibold text-cream/85 transition hover:bg-cream/10"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      <div className="mt-8 rounded-3xl border border-cream/[0.06] bg-cream/[0.02] p-5 text-xs text-cream/55">
        <div className="inline-flex items-center gap-2 text-cream/65">
          <MessageSquare size={12} />
          Account
        </div>
        <div className="mt-2 grid gap-1">
          <div>
            Customer ID:{" "}
            <span className="font-mono text-cream/80">
              {profile._id.slice(-8).toUpperCase()}
            </span>
          </div>
          {profile.signupProvider ? (
            <div>
              Signed up via{" "}
              <span className="font-medium text-cream/80">
                {profile.signupProvider}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
