import { describe, it, expect } from "vitest";
import { getTableConfig } from "drizzle-orm/mysql-core";
import {
  persons,
  locations,
  timeslots,
  bookings,
  personTypes,
  bookingStatuses,
  type NewPerson,
} from "./schema";

describe("schema", () => {
  it("exports persons and locations tables", () => {
    expect(persons).toBeDefined();
    expect(locations).toBeDefined();
  });

  it("exports timeslots and bookings tables", () => {
    expect(timeslots).toBeDefined();
    expect(bookings).toBeDefined();
  });

  it("person type union includes photographer, cosplayer, organizer", () => {
    expect(personTypes).toEqual(["photographer", "cosplayer", "organizer"]);
  });

  it("NewPerson accepts optional gallery JSON fields", () => {
    const person: NewPerson = {
      type: "photographer",
      name: "Anna",
      email: "anna@example.com",
      portfolioUrls: ["https://example.com/1.jpg"],
    };
    expect(person.portfolioUrls).toHaveLength(1);
  });

  it("bookingStatuses includes pending and confirmed", () => {
    expect(bookingStatuses).toEqual(["pending", "confirmed"]);
  });

  it("bookings table does not enforce location+timeslot uniqueness", () => {
    const config = getTableConfig(bookings);
    const uniqueConstraint = config.uniqueConstraints.find(
      (c) => c.name === "bookings_location_timeslot_unique",
    );
    expect(uniqueConstraint).toBeUndefined();
  });
});
