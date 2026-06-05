ALTER TABLE "veterinarios_certificados_cordoba" RENAME TO "veterinarios_matriculados_cordoba";--> statement-breakpoint
ALTER TABLE "veterinarios_matriculados_cordoba" DROP CONSTRAINT "veterinarios_certificados_cordoba_numero_matricula_unique";--> statement-breakpoint
ALTER TABLE "veterinarios_matriculados_cordoba" DROP CONSTRAINT "veterinarios_certificados_cordoba_dni_unique";--> statement-breakpoint
ALTER TABLE "veterinarios_matriculados_cordoba" DROP CONSTRAINT "veterinarios_certificados_cordoba_categoria_id_categorias_matriculas_id_fk";
--> statement-breakpoint
ALTER TABLE "veterinarios_matriculados_cordoba" ADD CONSTRAINT "veterinarios_matriculados_cordoba_categoria_id_categorias_matriculas_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_matriculas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veterinarios_matriculados_cordoba" ADD CONSTRAINT "veterinarios_matriculados_cordoba_numero_matricula_unique" UNIQUE("numero_matricula");--> statement-breakpoint
ALTER TABLE "veterinarios_matriculados_cordoba" ADD CONSTRAINT "veterinarios_matriculados_cordoba_dni_unique" UNIQUE("dni");