CREATE TABLE `orders` (
	`id` varchar(255) NOT NULL,
	`erc20` varchar(42) NOT NULL,
	`from` varchar(42) NOT NULL,
	`to` varchar(42) NOT NULL,
	`amount` bigint NOT NULL,
	`txHash` varchar(66),
	`chainId` int NOT NULL,
	`signature` varchar(512) NOT NULL,
	`timestamp` bigint unsigned NOT NULL,
	`error` varchar(255),
	`status` enum('PENDING','VERIFYING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_tx_hash_idx` UNIQUE(`txHash`)
);
--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`,`id`);--> statement-breakpoint
CREATE INDEX `orders_payload_composite_idx` ON `orders` (`to`,`from`,`erc20`,`amount`);