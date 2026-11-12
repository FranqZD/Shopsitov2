CREATE TABLE `calificaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`estrellas` integer NOT NULL,
	`comentario` text,
	`fecha` text NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "calificaciones_estrellas_chk" CHECK("calificaciones"."estrellas" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calificaciones_pedido_unq` ON `calificaciones` (`pedido_id`);--> statement-breakpoint
CREATE TABLE `codigos_verificacion` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`codigo` text NOT NULL,
	`tipo` text NOT NULL,
	`expira_en` text NOT NULL,
	`usado` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `detalle_pedido` (
	`id` text PRIMARY KEY NOT NULL,
	`pedido_id` text NOT NULL,
	`producto_id` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` integer NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notificaciones` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`mensaje` text NOT NULL,
	`leida` integer DEFAULT false NOT NULL,
	`fecha` text NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` text PRIMARY KEY NOT NULL,
	`comprador_id` text NOT NULL,
	`vendedor_id` text NOT NULL,
	`punto_entrega_id` text NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`total` integer NOT NULL,
	`creado_en` text NOT NULL,
	FOREIGN KEY (`comprador_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`punto_entrega_id`) REFERENCES `puntos_entrega`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `productos` (
	`id` text PRIMARY KEY NOT NULL,
	`vendedor_id` text NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text DEFAULT '' NOT NULL,
	`precio` integer NOT NULL,
	`cantidad` integer NOT NULL,
	`foto_key` text,
	`fecha` text NOT NULL,
	`hora_limite` text NOT NULL,
	`estado` text DEFAULT 'disponible' NOT NULL,
	FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `productos_fecha_idx` ON `productos` (`fecha`,`hora_limite`);--> statement-breakpoint
CREATE TABLE `puntos_entrega` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`ubicacion` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reportes` (
	`id` text PRIMARY KEY NOT NULL,
	`reportante_id` text NOT NULL,
	`objetivo_id` text NOT NULL,
	`motivo` text NOT NULL,
	`estado` text DEFAULT 'abierto' NOT NULL,
	FOREIGN KEY (`reportante_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`correo` text NOT NULL,
	`password_hash` text NOT NULL,
	`telefono` text,
	`rol` text DEFAULT 'usuario' NOT NULL,
	`correo_verificado` integer DEFAULT false NOT NULL,
	`correo_institucional` text,
	`insignia_comunidad` integer DEFAULT false NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_correo_unique` ON `usuarios` (`correo`);