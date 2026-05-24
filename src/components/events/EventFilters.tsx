"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type City = { _id: string; value: string; state?: string | null };
type Category = { _id: string; value: string };

export const EventFilters = ({
  cities,
  categories,
}: {
  cities: City[];
  categories: Category[];
}) => {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    startTransition(() => {
      router.push(`/events${next.toString() ? `?${next}` : ""}`);
    });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_220px_220px_180px]">
      <input
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder="Search events…"
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
      <select
        defaultValue={params.get("category") ?? ""}
        onChange={(event) => update("category", event.target.value)}
        className="h-11 rounded-full border border-border bg-cream px-4 text-sm outline-none focus:border-accent"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.value}
          </option>
        ))}
      </select>
      <select
        defaultValue={params.get("when") ?? ""}
        onChange={(event) => update("when", event.target.value)}
        className="h-11 rounded-full border border-border bg-cream px-4 text-sm outline-none focus:border-accent"
      >
        <option value="">Any date</option>
        <option value="today">Today</option>
        <option value="weekend">This weekend</option>
        <option value="month">Next 30 days</option>
      </select>
      {pending ? (
        <div className="col-span-full text-center text-xs text-muted">Updating…</div>
      ) : null}
    </div>
  );
};
