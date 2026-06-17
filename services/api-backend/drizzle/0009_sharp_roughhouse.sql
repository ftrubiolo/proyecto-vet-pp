CREATE TABLE "horarios_laborales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"veterinario_id" uuid NOT NULL,
	"clinica_id" uuid NOT NULL,
	"dia_semana" integer NOT NULL,
	"hora_inicio" varchar(5) NOT NULL,
	"hora_fin" varchar(5) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suscripciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"mp_preapproval_id" varchar,
	"mp_payer_id" varchar,
	"estado" varchar(20) DEFAULT 'inactivo' NOT NULL,
	"plan" varchar(20),
	"fecha_expiracion" timestamp,
	"grace_period_start" timestamp,
	CONSTRAINT "suscripciones_mp_preapproval_id_unique" UNIQUE("mp_preapproval_id")
);
--> statement-breakpoint
ALTER TABLE "horarios_laborales" ADD CONSTRAINT "horarios_laborales_veterinario_id_veterinarios_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios_laborales" ADD CONSTRAINT "horarios_laborales_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suscripciones" ADD CONSTRAINT "suscripciones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;