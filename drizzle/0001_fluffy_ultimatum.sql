CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`anomalyId` int,
	`severity` varchar(32) NOT NULL,
	`message` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anomalies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`readingId` int,
	`type` varchar(120) NOT NULL,
	`deviationScore` double NOT NULL,
	`riskScore` double NOT NULL,
	`confidence` double NOT NULL,
	`description` text NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'investigation_required',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anomalies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `electricSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`feature` varchar(64) NOT NULL,
	`baselineValue` double NOT NULL,
	`minValue` double NOT NULL,
	`maxValue` double NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `electricSignatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feeders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transformerId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'normal',
	CONSTRAINT `feeders_id` PRIMARY KEY(`id`),
	CONSTRAINT `feeders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`voltage` double NOT NULL,
	`current` double NOT NULL,
	`power` double NOT NULL,
	`energy` double NOT NULL,
	`powerFactor` double NOT NULL,
	`loadPercentage` double NOT NULL,
	CONSTRAINT `readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `runtimeState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`mode` varchar(64) NOT NULL DEFAULT 'normal',
	`activeSection` varchar(32) NOT NULL DEFAULT 'SEC-31',
	`activeAnomalyId` int,
	`simulationActive` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `runtimeState_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`feederId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(32) NOT NULL,
	`location` varchar(120) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'normal',
	CONSTRAINT `sections_id` PRIMARY KEY(`id`),
	CONSTRAINT `sections_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `simulationEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(64) NOT NULL,
	`location` varchar(64) NOT NULL,
	`parameters` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulationEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `substations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(32) NOT NULL,
	`location` varchar(120) NOT NULL,
	`latitude` double NOT NULL,
	`longitude` double NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'normal',
	CONSTRAINT `substations_id` PRIMARY KEY(`id`),
	CONSTRAINT `substations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `transformers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`substationId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`code` varchar(32) NOT NULL,
	`capacity` double NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'normal',
	CONSTRAINT `transformers_id` PRIMARY KEY(`id`),
	CONSTRAINT `transformers_code_unique` UNIQUE(`code`)
);
