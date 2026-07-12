ALTER TABLE `persons` ADD `login_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `persons` ADD CONSTRAINT `persons_login_hash_unique` UNIQUE(`login_hash`);