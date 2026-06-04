"use client";

import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CenteredLoader } from "@/components/ui/feedback";
import { gqlRequest } from "@/lib/graphql";
import { UPDATE_MY_PROFILE_MUTATION } from "@/lib/queries";
import { useAuthStore } from "@/store/auth";
import type { CustomerProfile } from "@/types/auth";
import { uploadCustomerAvatar } from "@/utils/cloudinaryUpload";

export const ProfileClient = () => {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [profilePic, setProfilePic] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

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

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName ?? "");
    setLastName(profile.lastName ?? "");
    setEmail(profile.email ?? "");
    setCity(profile.city ?? "");
    setProfilePic(profile.profilePic);
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
      // Persist the new URL on the customer record immediately so the
      // value survives a reload even if the user navigates away before
      // hitting "Save changes".
      await gqlRequest(UPDATE_MY_PROFILE_MUTATION, {
        input: { profilePic: result.secureUrl },
      });
      setProfilePic(result.secureUrl);
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
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    try {
      await gqlRequest<{ updateMyProfile: CustomerProfile }>(
        UPDATE_MY_PROFILE_MUTATION,
        {
          input: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            city: city.trim() || undefined,
          },
        }
      );
      useAuthStore.setState({ hydrated: false });
      await hydrate();
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

  if (!hydrated || !profile) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <CenteredLoader label="Loading your profile…" />
      </div>
    );
  }

  const initials = `${profile.firstName?.[0] ?? ""}${
    profile.lastName?.[0] ?? ""
  }`.toUpperCase();

  const inputClass =
    "mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-[#c5ff3d]/60 focus:bg-white/[0.06] placeholder:text-white/40";

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 text-white md:py-12">
      <h1 className="text-2xl font-semibold text-white md:text-3xl">
        My profile
      </h1>
      <p className="mt-1 text-sm text-white/60">
        Update your details and profile picture.
      </p>

      <div className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 text-white backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-xl font-semibold text-white ring-1 ring-inset ring-white/10">
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
              className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#1a181d] text-white shadow-lg disabled:opacity-50"
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
          <div className="text-sm">
            <div className="font-semibold text-white">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="text-xs text-white/55">{profile.email}</div>
            <div className="text-xs text-white/55">{profile.phone}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.04] p-5 text-white backdrop-blur-xl">
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            First name
          </span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            Last name
          </span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        {profile.secondaryEmail ? (
          <div className="text-xs text-white/55">
            Secondary email on file:{" "}
            <span className="font-medium text-white/80">
              {profile.secondaryEmail}
            </span>
          </div>
        ) : null}
        <label className="block text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            City
          </span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          {profile.googleConnected ? (
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
              Google connected
            </span>
          ) : null}
          {profile.appleConnected ? (
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40">
              Apple connected
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c5ff3d] text-sm font-semibold text-[#0a0a0e] transition hover:bg-[#d9ff6e] disabled:opacity-60"
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
      </div>
    </div>
  );
};
