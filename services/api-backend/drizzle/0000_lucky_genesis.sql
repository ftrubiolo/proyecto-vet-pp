CREATE TABLE "atenciones" (
	"id" uuid PRIMARY KEY NOT NULL,
	"cita_id" uuid,
	"mascota_id" uuid NOT NULL,
	"veterinario_id" uuid NOT NULL,
	"clinica_id" uuid NOT NULL,
	"notas_clinicas" text,
	"peso_actual" numeric(5, 2),
	"fecha_atencion" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "atenciones_cita_id_unique" UNIQUE("cita_id")
);
--> statement-breakpoint
CREATE TABLE "atenciones_diagnosticos" (
	"atencion_id" uuid NOT NULL,
	"diagnostico_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalogo_productos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"certificado_senasa" varchar NOT NULL,
	"nombre_comercial" varchar NOT NULL,
	"laboratorio" varchar NOT NULL,
	"es_vacuna" boolean DEFAULT false NOT NULL,
	CONSTRAINT "catalogo_productos_certificado_senasa_unique" UNIQUE("certificado_senasa")
);
--> statement-breakpoint
CREATE TABLE "citas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"mascota_id" uuid NOT NULL,
	"veterinario_id" uuid,
	"clinica_id" uuid NOT NULL,
	"fecha_hora" timestamp NOT NULL,
	"motivo_id" integer NOT NULL,
	"estado_cita_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinicas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombre_comercial" varchar NOT NULL,
	"direccion" text,
	"telefono" varchar
);
--> statement-breakpoint
CREATE TABLE "clinicas_mascotas" (
	"clinica_id" uuid,
	"mascota_id" uuid,
	"estado_paciente_id" integer,
	"fecha_admision" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagnosticos_atencion" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"categoria" varchar,
	CONSTRAINT "diagnosticos_atencion_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "especies" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	CONSTRAINT "especies_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "estados_cita" (
	"id" serial PRIMARY KEY NOT NULL,
	"estado" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "estados_cita_estado_unique" UNIQUE("estado")
);
--> statement-breakpoint
CREATE TABLE "estados_paciente" (
	"id" serial PRIMARY KEY NOT NULL,
	"estado" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "estados_paciente_estado_unique" UNIQUE("estado")
);
--> statement-breakpoint
CREATE TABLE "mascotas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"foto_url" varchar,
	"fecha_nacimiento" timestamp NOT NULL,
	"raza_id" integer NOT NULL,
	"sexo" char(1) NOT NULL,
	"es_castrado" boolean DEFAULT false NOT NULL,
	"numero_microchip" varchar
);
--> statement-breakpoint
CREATE TABLE "mascotas_propietarios" (
	"mascota_id" uuid,
	"propietario_id" uuid,
	"tipo_relacion_id" integer,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_asociacion" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "motivos_cita" (
	"id" serial PRIMARY KEY NOT NULL,
	"motivo" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "motivos_cita_motivo_unique" UNIQUE("motivo")
);
--> statement-breakpoint
CREATE TABLE "propietarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar NOT NULL,
	"apellido" varchar NOT NULL,
	"es_empresa" boolean DEFAULT false NOT NULL,
	"razon_social" varchar,
	"foto_url" varchar,
	"telefono" varchar NOT NULL,
	"direccion" varchar,
	CONSTRAINT "propietarios_usuario_id_unique" UNIQUE("usuario_id")
);
--> statement-breakpoint
CREATE TABLE "razas" (
	"id" serial PRIMARY KEY NOT NULL,
	"especie_id" integer NOT NULL,
	"nombre" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "roles_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "tipos_relacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "tipos_relacion_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "tipos_tratamiento" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar NOT NULL,
	"descripcion" text,
	CONSTRAINT "tipos_tratamiento_tipo_unique" UNIQUE("tipo")
);
--> statement-breakpoint
CREATE TABLE "tratamientos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"atencion_id" uuid NOT NULL,
	"tipo_tratamiento_id" integer NOT NULL,
	"producto_id" uuid NOT NULL,
	"dosis" varchar NOT NULL,
	"frecuencia" varchar NOT NULL,
	"fecha_inicio" timestamp NOT NULL,
	"fecha_fin" timestamp,
	"indicaciones_adicionales" text
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"rol_id" integer NOT NULL,
	"fecha_creacion" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vacunas" (
	"id" uuid PRIMARY KEY NOT NULL,
	"mascota_id" uuid NOT NULL,
	"veterinario_id" uuid,
	"atencion_id" uuid,
	"producto_id" uuid NOT NULL,
	"numero_lote" varchar,
	"fecha_aplicacion" timestamp NOT NULL,
	"fecha_proxima_dosis" timestamp
);
--> statement-breakpoint
CREATE TABLE "veterinarios" (
	"id" uuid PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"nombre" varchar NOT NULL,
	"apellido" varchar NOT NULL,
	"foto_url" varchar,
	"numero_matricula" varchar NOT NULL,
	"telefono" varchar,
	CONSTRAINT "veterinarios_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "veterinarios_numero_matricula_unique" UNIQUE("numero_matricula")
);
--> statement-breakpoint
CREATE TABLE "veterinarios_clinicas" (
	"veterinario_id" uuid,
	"clinica_id" uuid,
	"estado_activo" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "atenciones" ADD CONSTRAINT "atenciones_cita_id_citas_id_fk" FOREIGN KEY ("cita_id") REFERENCES "public"."citas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atenciones" ADD CONSTRAINT "atenciones_mascota_id_mascotas_id_fk" FOREIGN KEY ("mascota_id") REFERENCES "public"."mascotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atenciones" ADD CONSTRAINT "atenciones_veterinario_id_veterinarios_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atenciones" ADD CONSTRAINT "atenciones_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atenciones_diagnosticos" ADD CONSTRAINT "atenciones_diagnosticos_atencion_id_atenciones_id_fk" FOREIGN KEY ("atencion_id") REFERENCES "public"."atenciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atenciones_diagnosticos" ADD CONSTRAINT "atenciones_diagnosticos_diagnostico_id_diagnosticos_atencion_id_fk" FOREIGN KEY ("diagnostico_id") REFERENCES "public"."diagnosticos_atencion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_mascota_id_mascotas_id_fk" FOREIGN KEY ("mascota_id") REFERENCES "public"."mascotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_veterinario_id_veterinarios_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_motivo_id_motivos_cita_id_fk" FOREIGN KEY ("motivo_id") REFERENCES "public"."motivos_cita"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citas" ADD CONSTRAINT "citas_estado_cita_id_estados_cita_id_fk" FOREIGN KEY ("estado_cita_id") REFERENCES "public"."estados_cita"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicas_mascotas" ADD CONSTRAINT "clinicas_mascotas_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicas_mascotas" ADD CONSTRAINT "clinicas_mascotas_mascota_id_mascotas_id_fk" FOREIGN KEY ("mascota_id") REFERENCES "public"."mascotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicas_mascotas" ADD CONSTRAINT "clinicas_mascotas_estado_paciente_id_estados_paciente_id_fk" FOREIGN KEY ("estado_paciente_id") REFERENCES "public"."estados_paciente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mascotas" ADD CONSTRAINT "mascotas_raza_id_razas_id_fk" FOREIGN KEY ("raza_id") REFERENCES "public"."razas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mascotas_propietarios" ADD CONSTRAINT "mascotas_propietarios_mascota_id_mascotas_id_fk" FOREIGN KEY ("mascota_id") REFERENCES "public"."mascotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mascotas_propietarios" ADD CONSTRAINT "mascotas_propietarios_propietario_id_propietarios_id_fk" FOREIGN KEY ("propietario_id") REFERENCES "public"."propietarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mascotas_propietarios" ADD CONSTRAINT "mascotas_propietarios_tipo_relacion_id_tipos_relacion_id_fk" FOREIGN KEY ("tipo_relacion_id") REFERENCES "public"."tipos_relacion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propietarios" ADD CONSTRAINT "propietarios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "razas" ADD CONSTRAINT "razas_especie_id_especies_id_fk" FOREIGN KEY ("especie_id") REFERENCES "public"."especies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_atencion_id_atenciones_id_fk" FOREIGN KEY ("atencion_id") REFERENCES "public"."atenciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_tipo_tratamiento_id_tipos_tratamiento_id_fk" FOREIGN KEY ("tipo_tratamiento_id") REFERENCES "public"."tipos_tratamiento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_producto_id_catalogo_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."catalogo_productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacunas" ADD CONSTRAINT "vacunas_mascota_id_mascotas_id_fk" FOREIGN KEY ("mascota_id") REFERENCES "public"."mascotas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacunas" ADD CONSTRAINT "vacunas_veterinario_id_veterinarios_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacunas" ADD CONSTRAINT "vacunas_atencion_id_atenciones_id_fk" FOREIGN KEY ("atencion_id") REFERENCES "public"."atenciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacunas" ADD CONSTRAINT "vacunas_producto_id_catalogo_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."catalogo_productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veterinarios" ADD CONSTRAINT "veterinarios_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veterinarios_clinicas" ADD CONSTRAINT "veterinarios_clinicas_veterinario_id_veterinarios_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "veterinarios_clinicas" ADD CONSTRAINT "veterinarios_clinicas_clinica_id_clinicas_id_fk" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id") ON DELETE no action ON UPDATE no action;