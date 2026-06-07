ALTER TABLE "diagnosticos_atencion" RENAME COLUMN "nombre" TO "diagnostico";--> statement-breakpoint
ALTER TABLE "especies" RENAME COLUMN "nombre" TO "especie";--> statement-breakpoint
ALTER TABLE "razas" RENAME COLUMN "nombre" TO "raza";--> statement-breakpoint
ALTER TABLE "roles" RENAME COLUMN "nombre" TO "rol";--> statement-breakpoint
ALTER TABLE "tipos_relacion" RENAME COLUMN "nombre" TO "tipo";--> statement-breakpoint
ALTER TABLE "diagnosticos_atencion" DROP CONSTRAINT "diagnosticos_atencion_nombre_unique";--> statement-breakpoint
ALTER TABLE "especies" DROP CONSTRAINT "especies_nombre_unique";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_nombre_unique";--> statement-breakpoint
ALTER TABLE "tipos_relacion" DROP CONSTRAINT "tipos_relacion_nombre_unique";--> statement-breakpoint
ALTER TABLE "diagnosticos_atencion" ADD CONSTRAINT "diagnosticos_atencion_diagnostico_unique" UNIQUE("diagnostico");--> statement-breakpoint
ALTER TABLE "especies" ADD CONSTRAINT "especies_especie_unique" UNIQUE("especie");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_rol_unique" UNIQUE("rol");--> statement-breakpoint
ALTER TABLE "tipos_relacion" ADD CONSTRAINT "tipos_relacion_tipo_unique" UNIQUE("tipo");