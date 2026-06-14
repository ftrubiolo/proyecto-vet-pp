CREATE TABLE "vacuna_dosis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serie_id" uuid NOT NULL,
	"atencion_id" uuid,
	"numero_dosis" integer NOT NULL,
	"fecha_aplicacion" timestamp NOT NULL,
	"lote" varchar NOT NULL,
	"via_administracion" varchar NOT NULL,
	"observaciones" text
);
--> statement-breakpoint
CREATE TABLE "vacuna_protocolo" (
	"senasa_id" integer PRIMARY KEY NOT NULL,
	"numero_inscripcion" varchar,
	"nombre_comercial" varchar,
	"observaciones" text,
	"indicaciones_y_vias" text,
	"especies_target" varchar[],
	"dosificacion_por_esp" jsonb,
	"vias_administracion" varchar[],
	"fecha_validez" timestamp NOT NULL,
	"total_dosis_serie_primaria" integer NOT NULL,
	"intervalo_dias" integer[],
	"tiene_refuerzo" boolean DEFAULT false NOT NULL,
	"refuerzo_cada_dias" integer
);
--> statement-breakpoint
CREATE TABLE "vacuna_serie" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocolo_id" integer NOT NULL,
	"mascota_id" uuid NOT NULL,
	"veterinario_id" uuid NOT NULL,
	"fecha_inicio" timestamp NOT NULL,
	"estado_serie" varchar(20) DEFAULT 'en_curso' NOT NULL,
	"dosis_aplicadas" integer NOT NULL,
	"proximo_refuerzo" timestamp
);
--> statement-breakpoint
ALTER TABLE "mascotas" ADD COLUMN "alergias" text;--> statement-breakpoint
ALTER TABLE "mascotas" ADD COLUMN "condiciones_cronicas" text;--> statement-breakpoint
ALTER TABLE "mascotas" ADD COLUMN "contraindicaciones" text;--> statement-breakpoint
ALTER TABLE "vacuna_dosis" ADD CONSTRAINT "vacuna_dosis_serie_id_vacuna_serie_id_fk" FOREIGN KEY ("serie_id") REFERENCES "public"."vacuna_serie"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacuna_dosis" ADD CONSTRAINT "vacuna_dosis_atencion_id_atenciones_id_fk" FOREIGN KEY ("atencion_id") REFERENCES "public"."atenciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacuna_serie" ADD CONSTRAINT "vacuna_serie_protocolo_id_vacuna_protocolo_senasa_id_fk" FOREIGN KEY ("protocolo_id") REFERENCES "public"."vacuna_protocolo"("senasa_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacuna_serie" ADD CONSTRAINT "vacuna_serie_mascota_id_mascotas_id_fk" FOREIGN KEY ("mascota_id") REFERENCES "public"."mascotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacuna_serie" ADD CONSTRAINT "vacuna_serie_veterinario_id_veterinarios_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinarios"("id") ON DELETE no action ON UPDATE no action;