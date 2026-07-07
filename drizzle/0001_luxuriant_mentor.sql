CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cosplayer_id` int NOT NULL,
	`photographer_id` int NOT NULL,
	`location_id` int NOT NULL,
	`timeslot_id` int NOT NULL,
	`status` enum('confirmed') NOT NULL DEFAULT 'confirmed',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_location_timeslot_unique` UNIQUE(`location_id`,`timeslot_id`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`address` varchar(512),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`preview_gallery_urls` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('photographer','cosplayer','organizer') NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`description` text,
	`instagram` varchar(512),
	`facebook` varchar(512),
	`twitter` varchar(512),
	`website` varchar(512),
	`portfolio_urls` json,
	`reference_image_urls` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `persons_id` PRIMARY KEY(`id`),
	CONSTRAINT `persons_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `timeslots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(64) NOT NULL,
	`start_time` time NOT NULL,
	`bookable` boolean NOT NULL,
	CONSTRAINT `timeslots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_cosplayer_id_persons_id_fk` FOREIGN KEY (`cosplayer_id`) REFERENCES `persons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_photographer_id_persons_id_fk` FOREIGN KEY (`photographer_id`) REFERENCES `persons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_location_id_locations_id_fk` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_timeslot_id_timeslots_id_fk` FOREIGN KEY (`timeslot_id`) REFERENCES `timeslots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO `timeslots` (`id`, `label`, `start_time`, `bookable`) VALUES
(1, 'Gatherup', '09:00:00', 0),
(2, 'First shoot', '09:30:00', 1),
(3, 'Second shoot', '11:00:00', 1),
(4, 'Third shoot', '12:30:00', 1);