import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  json,
  decimal,
  time,
  boolean,
} from "drizzle-orm/mysql-core";

// Domain tables: app_health (probe), persons, locations, timeslots, bookings.
// See docs/architecture/app-workflow.md for entity relationships.

export const personTypes = ["photographer", "cosplayer", "organizer"] as const;
export type PersonType = (typeof personTypes)[number];

export const bookingStatuses = ["pending", "confirmed"] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const appHealth = mysqlTable("app_health", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 64 }).notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

export const persons = mysqlTable("persons", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", personTypes).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  description: text("description"),
  instagram: varchar("instagram", { length: 512 }),
  facebook: varchar("facebook", { length: 512 }),
  twitter: varchar("twitter", { length: 512 }),
  website: varchar("website", { length: 512 }),
  portfolioUrls: json("portfolio_urls").$type<string[]>(),
  referenceImageUrls: json("reference_image_urls").$type<string[]>(),
  loginHash: varchar("login_hash", { length: 64 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const locations = mysqlTable("locations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: varchar("address", { length: 512 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  previewGalleryUrls: json("preview_gallery_urls").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const timeslots = mysqlTable("timeslots", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 64 }).notNull(),
  startTime: time("start_time").notNull(),
  bookable: boolean("bookable").notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  cosplayerId: int("cosplayer_id")
    .notNull()
    .references(() => persons.id),
  photographerId: int("photographer_id")
    .notNull()
    .references(() => persons.id),
  locationId: int("location_id")
    .notNull()
    .references(() => locations.id),
  timeslotId: int("timeslot_id")
    .notNull()
    .references(() => timeslots.id),
  status: mysqlEnum("status", bookingStatuses).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type Timeslot = typeof timeslots.$inferSelect;
export type NewTimeslot = typeof timeslots.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
