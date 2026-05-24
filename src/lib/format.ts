export const rupee = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

export const formatEventDate = (value?: string) => {
  if (!value) return "Date pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date pending";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const minTicketPrice = (
  tickets: { ticketPrice: number; ticketVisible?: boolean }[] | undefined | null
): number | null => {
  if (!tickets?.length) return null;
  const visible = tickets.filter((t) => t.ticketVisible !== false);
  if (!visible.length) return null;
  return Math.min(...visible.map((t) => Number(t.ticketPrice ?? 0)));
};
