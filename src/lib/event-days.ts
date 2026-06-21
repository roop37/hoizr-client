import type { PublicEvent, PublicEventDay, PublicTicket } from "@/types/event";

/** Festival-pass sentinel — mirrors ALL_DAYS_TICKET in @hoizr-technology/shared. */
export const ALL_DAYS_TICKET = "ALL_DAYS";

export const isMultiDayEvent = (
  event: Pick<PublicEvent, "days">
): boolean => Array.isArray(event.days) && event.days.length > 0;

export const isAllDaysTicket = (ticket: PublicTicket): boolean =>
  ticket.dayId === ALL_DAYS_TICKET;

/** A ticket admits a day if it's an all-days pass, untagged, or matches it. */
export const ticketAdmitsDay = (
  ticket: PublicTicket,
  dayId: string
): boolean =>
  ticket.dayId == null ||
  ticket.dayId === ALL_DAYS_TICKET ||
  ticket.dayId === dayId;

const ms = (d: string): number => new Date(d).getTime();

/**
 * Has the sales window for a ticket closed? A day-specific ticket closes at its
 * day's start; an all-days pass closes at the earliest day start. Mirrors the
 * server's daySalesClosed so the UI matches what the cart will accept.
 */
export const ticketSalesClosed = (
  event: PublicEvent,
  ticket: PublicTicket,
  now: Date
): boolean => {
  const days = event.days ?? [];
  if (days.length === 0) return false;
  const t = now.getTime();
  if (ticket.dayId === ALL_DAYS_TICKET) {
    return t >= Math.min(...days.map((d) => ms(d.startDate)));
  }
  const day = days.find((d) => d.dayId === ticket.dayId);
  return day ? t >= ms(day.startDate) : false;
};

const ticketSellable = (event: PublicEvent, t: PublicTicket, now: Date): boolean =>
  t.ticketVisible !== false &&
  !t.markAsComingSoon &&
  !t.markAsOnGroundOnly &&
  Number(t.ticketSold ?? 0) < Number(t.ticketCapacity ?? 0) &&
  !ticketSalesClosed(event, t, now);

export type DayGroup = { day: PublicEventDay; tickets: PublicTicket[] };

/**
 * Day-specific tickets grouped by their day, plus the all-days-pass bucket
 * (always shown regardless of the selected day, per the design spec §6).
 */
export const groupTicketsByDay = (
  event: PublicEvent
): { groups: DayGroup[]; allDays: PublicTicket[] } => {
  const days = event.days ?? [];
  const tickets = event.tickets ?? [];
  const allDays = tickets.filter((t) => t.dayId === ALL_DAYS_TICKET);
  const groups = days.map((day) => ({
    day,
    tickets: tickets.filter((t) => t.dayId === day.dayId),
  }));
  return { groups, allDays };
};

/**
 * Default day to show: the first day with a purchasable (sellable, not
 * sales-closed) day-specific ticket; if none qualifies, the first day.
 */
export const preselectDayId = (
  event: PublicEvent,
  now: Date
): string | null => {
  const days = event.days ?? [];
  if (days.length === 0) return null;
  const { groups } = groupTicketsByDay(event);
  for (const { day, tickets } of groups) {
    if (tickets.some((t) => ticketSellable(event, t, now))) return day.dayId;
  }
  return days[0].dayId;
};
