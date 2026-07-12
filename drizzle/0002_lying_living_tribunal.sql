CREATE INDEX `bookings_location_id_idx` ON `bookings` (`location_id`);--> statement-breakpoint
ALTER TABLE `bookings` DROP INDEX `bookings_location_timeslot_unique`;--> statement-breakpoint
ALTER TABLE `bookings` MODIFY COLUMN `status` enum('pending','confirmed') NOT NULL DEFAULT 'pending';