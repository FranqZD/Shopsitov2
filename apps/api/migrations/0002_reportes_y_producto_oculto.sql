ALTER TABLE `reportes` ADD `tipo_objetivo` text DEFAULT 'usuario' NOT NULL;--> statement-breakpoint
ALTER TABLE `reportes` ADD `detalle` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `reportes` ADD `nota` text;--> statement-breakpoint
ALTER TABLE `reportes` ADD `creado_en` text DEFAULT '' NOT NULL;