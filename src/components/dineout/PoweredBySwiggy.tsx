// Required on every Dineout surface. Keep the supplied lockup intact; the
// Swiggy wordmark is an image, never reconstructed or recoloured with text.
export function PoweredBySwiggy() {
  return (
    <div className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
      <span>Powered by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brands/swiggy.svg"
        alt="Swiggy"
        width={159}
        height={49}
        className="h-[17px] w-auto shrink-0 object-contain"
      />
    </div>
  );
}
