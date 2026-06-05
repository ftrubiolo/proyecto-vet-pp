CREATE TABLE "categorias_certificados" (
	"id" varchar(2) PRIMARY KEY NOT NULL,
	"categoria" varchar NOT NULL,
	"cobertura" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "veterinarios_certificados_cordoba" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre_completo" varchar NOT NULL,
	"numero_matricula" varchar NOT NULL,
	"dni" varchar NOT NULL,
	"categoria_id" varchar NOT NULL,
	"es_valido" boolean DEFAULT true NOT NULL,
	"actualizado_el" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "veterinarios_certificados_cordoba_numero_matricula_unique" UNIQUE("numero_matricula"),
	CONSTRAINT "veterinarios_certificados_cordoba_dni_unique" UNIQUE("dni")
);
--> statement-breakpoint
ALTER TABLE "atenciones" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "catalogo_productos" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "citas" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "clinicas" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "mascotas" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "propietarios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tratamientos" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "vacunas" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "veterinarios" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "veterinarios_certificados_cordoba" ADD CONSTRAINT "veterinarios_certificados_cordoba_categoria_id_categorias_certificados_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_certificados"("id") ON DELETE no action ON UPDATE no action;