import assert from "node:assert/strict";
import test from "node:test";
import type { PublicEvent, PublicTicket } from "@/types/event";
import {
  ALL_DAYS_TICKET,
  groupTicketsByDay,
  isMultiDayEvent,
  preselectDayId,
  ticketAdmitsDay,
  ticketSalesClosed,
} from "./event-days.ts";

const mk = (over: Partial<PublicTicket>): PublicTicket =>
  ({
    _id: over._id ?? "t",
    ticketCategory: "GENERAL",
    ticketName: over.ticketName ?? "T",
    ticketCapacity: over.ticketCapacity ?? 100,
    ticketSold: over.ticketSold ?? 0,
    ticketPrice: 100,
    ...over,
  }) as PublicTicket;

const event = (): PublicEvent => ({
  _id: "e1",
  days: [
    { dayId: "d1", title: "Day 1", startDate: "2026-06-21T11:30:00Z", endDate: "2026-06-21T13:30:00Z" },
    { dayId: "d2", title: "Day 2", startDate: "2026-06-22T11:30:00Z", endDate: "2026-06-22T13:30:00Z" },
  ],
  tickets: [
    mk({ _id: "a", dayId: "d1", ticketName: "GA Day 1" }),
    mk({ _id: "b", dayId: "d2", ticketName: "GA Day 2" }),
    mk({ _id: "p", dayId: ALL_DAYS_TICKET, ticketName: "Festival Pass" }),
  ],
});

test("isMultiDayEvent", () => {
  assert.equal(isMultiDayEvent(event()), true);
  assert.equal(isMultiDayEvent({ days: [] } as any), false);
  assert.equal(isMultiDayEvent({} as any), false);
});

test("ticketAdmitsDay", () => {
  assert.equal(ticketAdmitsDay(mk({ dayId: "d1" }), "d1"), true);
  assert.equal(ticketAdmitsDay(mk({ dayId: "d2" }), "d1"), false);
  assert.equal(ticketAdmitsDay(mk({ dayId: ALL_DAYS_TICKET }), "d1"), true);
  assert.equal(ticketAdmitsDay(mk({ dayId: null }), "d1"), true);
});

test("groupTicketsByDay splits days + all-days bucket", () => {
  const { groups, allDays } = groupTicketsByDay(event());
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].tickets.map((t) => t._id), ["a"]);
  assert.deepEqual(groups[1].tickets.map((t) => t._id), ["b"]);
  assert.deepEqual(allDays.map((t) => t._id), ["p"]);
});

test("ticketSalesClosed: day-specific closes at day start", () => {
  const e = event();
  const d1 = e.tickets!.find((t) => t._id === "a")!;
  assert.equal(ticketSalesClosed(e, d1, new Date("2026-06-21T11:00:00Z")), false);
  assert.equal(ticketSalesClosed(e, d1, new Date("2026-06-21T11:30:00Z")), true);
  const d2 = e.tickets!.find((t) => t._id === "b")!;
  // Day 2 still open while Day 1 has closed.
  assert.equal(ticketSalesClosed(e, d2, new Date("2026-06-21T11:30:00Z")), false);
});

test("ticketSalesClosed: all-days pass closes at earliest day start", () => {
  const e = event();
  const pass = e.tickets!.find((t) => t._id === "p")!;
  assert.equal(ticketSalesClosed(e, pass, new Date("2026-06-21T11:00:00Z")), false);
  assert.equal(ticketSalesClosed(e, pass, new Date("2026-06-21T11:30:00Z")), true);
});

test("preselectDayId: first day with availability", () => {
  // Before any day starts → Day 1.
  assert.equal(preselectDayId(event(), new Date("2026-06-20T00:00:00Z")), "d1");
});

test("preselectDayId: skips closed Day 1 → Day 2", () => {
  // After Day 1 start (its sales closed) but before Day 2 → Day 2.
  assert.equal(preselectDayId(event(), new Date("2026-06-21T12:00:00Z")), "d2");
});

test("preselectDayId: all days closed → falls back to first day", () => {
  assert.equal(preselectDayId(event(), new Date("2026-06-23T00:00:00Z")), "d1");
});
