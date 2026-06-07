ALTER TABLE "catalogo_productos" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "catalogo_productos" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tratamientos" ALTER COLUMN "producto_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "vacunas" ALTER COLUMN "producto_id" SET DATA TYPE integer;