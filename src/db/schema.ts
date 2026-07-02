import { mysqlTable, int, varchar, timestamp } from "drizzle-orm/mysql-core";

// Minimal placeholder table so migrations have something to generate and the
// health check has a real table to reference. Domain tables (sites, timeslots,
// photographers, cosplayers, sessions) are deferred to the scheduling milestone.
export const appHealth = mysqlTable("app_health", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 64 }).notNull(),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});
