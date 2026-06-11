CREATE TABLE "categorias_productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"id_senasa" integer NOT NULL,
	"categoria" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "categorias_productos_id_senasa_unique" UNIQUE("id_senasa"),
	CONSTRAINT "categorias_productos_categoria_unique" UNIQUE("categoria")
);
--> statement-breakpoint
CREATE TABLE "productos_categorias" (
	"producto_id" integer NOT NULL,
	"categoria_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "catalogo_productos" RENAME COLUMN "certificado_senasa" TO "numero_senasa";--> statement-breakpoint
ALTER TABLE "catalogo_productos" RENAME COLUMN "laboratorio" TO "nombre_firma";--> statement-breakpoint
ALTER TABLE "catalogo_productos" DROP CONSTRAINT "catalogo_productos_certificado_senasa_unique";--> statement-breakpoint
ALTER TABLE "productos_categorias" ADD CONSTRAINT "productos_categorias_producto_id_catalogo_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."catalogo_productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productos_categorias" ADD CONSTRAINT "productos_categorias_categoria_id_categorias_productos_id_senasa_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_productos"("id_senasa") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogo_productos" DROP COLUMN "es_vacuna";--> statement-breakpoint
ALTER TABLE "catalogo_productos" ADD CONSTRAINT "catalogo_productos_numero_senasa_unique" UNIQUE("numero_senasa");