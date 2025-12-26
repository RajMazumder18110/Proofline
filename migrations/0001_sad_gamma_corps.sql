ALTER TABLE `orders` DROP INDEX `orders_tx_hash_idx`;--> statement-breakpoint
CREATE INDEX `orders_tx_hash_idx` ON `orders` (`txHash`);