"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type City = { _id: string; value: string; state?: string | null };

export const ArtistFilters = ({ cities }: { cities: City[] }) => {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => {
      router.push(`/artist${next.toString() ? `?${next}` : ""}`);
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
      <input
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search artists…"
        onChange={(event) => update("q", event.target.value)}
        className="h-11 rounded-full border border-border bg-cream px-4 text-sm outline-none focus:border-accent"
      />
      <select
        defaultValue={params.get("city") ?? ""}
        onChange={(event) => update("city", event.target.value)}
        className="h-11 rounded-full border border-border bg-cream px-4 text-sm outline-none focus:border-accent"
      >
        <option value="">All cities</option>
        {cities.map((city) => (
          <option key={city._id} value={city.value}>
            {city.value}
          </option>
        ))}
      </select>
      {pending ? (
        <div className="col-span-full text-center text-xs text-muted">
          Updating…
        </div>
      ) : null}
    </div>
  );
};
