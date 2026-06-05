ALTER TABLE "categorias_certificados" RENAME TO "categorias_matriculas";--> statement-breakpoint
ALTER TABLE "veterinarios_certificados_cordoba" DROP CONSTRAINT "veterinarios_certificados_cordoba_categoria_id_categorias_certificados_id_fk";
--> statement-breakpoint
ALTER TABLE "veterinarios_certificados_cordoba" ADD CONSTRAINT "veterinarios_certificados_cordoba_categoria_id_categorias_matriculas_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_matriculas"("id") ON DELETE no action ON UPDATE no action;