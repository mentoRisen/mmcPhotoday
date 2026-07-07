CREATE TABLE `app_health` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(64) NOT NULL,
	`checked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_health_id` PRIMARY KEY(`id`)
);
