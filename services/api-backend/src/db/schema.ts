import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal, uuid, char } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  rol: varchar('rol').notNull().unique(),
  descripcion: text('descripcion'),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  usuarios: many(usuarios),
}));

export const usuarios = pgTable('usuarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email').notNull().unique(),
  password_hash: varchar('password_hash').notNull(),
  rol_id: integer('rol_id').notNull().references(() => roles.id),
  fecha_creacion: timestamp('fecha_creacion').defaultNow().notNull(),
});

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  rol: one(roles, { fields: [usuarios.rol_id], references: [roles.id] }),
  veterinarios: many(veterinarios),
  propietarios: many(propietarios),
}));

export const clinicas = pgTable('clinicas', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre_comercial: varchar('nombre_comercial').notNull(),
  direccion: text('direccion'),
  telefono: varchar('telefono'),
});

export const clinicasRelations = relations(clinicas, ({ many }) => ({
  veterinarios_clinicas: many(veterinarios_clinicas),
  citas: many(citas),
}));

export const veterinarios = pgTable('veterinarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().unique().references(() => usuarios.id),
  nombre: varchar('nombre').notNull(),
  apellido: varchar('apellido').notNull(),
  foto_url: varchar('foto_url'),
  numero_matricula: varchar('numero_matricula').notNull().unique(),
  telefono: varchar('telefono'),
});

export const veterinariosRelations = relations(veterinarios, ({ one, many }) => ({
  veterinarios_clinicas: many(veterinarios_clinicas),
  usuario: one(usuarios, { fields: [veterinarios.usuario_id], references: [usuarios.id] }),
  citas: many(citas),
  atenciones: many(atenciones),
  vacunas: many(vacunas),
}));

export const veterinarios_clinicas = pgTable('veterinarios_clinicas', {
  veterinario_id: uuid('veterinario_id').references(() => veterinarios.id),
  clinica_id: uuid('clinica_id').references(() => clinicas.id),
  estado_activo: boolean('estado_activo').default(true),
})

export const veterinariosClinicasRelations = relations(veterinarios_clinicas, ({ one }) => ({
  veterinario: one(veterinarios, { fields: [veterinarios_clinicas.veterinario_id], references: [veterinarios.id] }),
  clinica: one(clinicas, { fields: [veterinarios_clinicas.clinica_id], references: [clinicas.id] }),
}));

export const propietarios = pgTable('propietarios', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: uuid('usuario_id').notNull().unique().references(() => usuarios.id),
  nombre: varchar('nombre').notNull(),
  apellido: varchar('apellido').notNull(),
  es_empresa: boolean('es_empresa').default(false).notNull(),
  razon_social: varchar('razon_social'),
  foto_url: varchar('foto_url'),
  telefono: varchar('telefono').notNull(),
  direccion: varchar('direccion'),
});

export const propietariosRelations = relations(propietarios, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [propietarios.usuario_id], references: [usuarios.id] }),
  mascotas_propietarios: many(mascotas_propietarios),
}));

export const especies = pgTable('especies', {
  id: serial('id').primaryKey(),
  especie: varchar('especie').notNull().unique(),
});

export const especiesRelations = relations(especies, ({ many }) => ({
  razas: many(razas),
}));

export const razas = pgTable('razas', {
  id: serial('id').primaryKey(),
  especie_id: integer('especie_id').notNull().references(() => especies.id),
  raza: varchar('raza').notNull(),
});

export const razasRelations = relations(razas, ({ one, many }) => ({
  especie: one(especies, { fields: [razas.especie_id], references: [especies.id] }),
  mascotas: many(mascotas),
}));

export const mascotas = pgTable('mascotas', {
  id: uuid('id').defaultRandom().primaryKey(),
  nombre: varchar('nombre').notNull(),
  foto_url: varchar('foto_url'),
  fecha_nacimiento: timestamp('fecha_nacimiento').notNull(),
  raza_id: integer('raza_id').notNull().references(() => razas.id),
  sexo: char('sexo', { length: 1 }).notNull(), // 'M' o 'H'
  es_castrado: boolean('es_castrado').default(false).notNull(),
  numero_microchip: varchar('numero_microchip'),
});

export const mascotasRelations = relations(mascotas, ({ one, many }) => ({
  raza: one(razas, { fields: [mascotas.raza_id], references: [razas.id] }),
  mascotas_propietarios: many(mascotas_propietarios),
  citas: many(citas),
  atenciones: many(atenciones),
  vacunas: many(vacunas),
}));

export const mascotas_propietarios = pgTable('mascotas_propietarios', {
  mascota_id: uuid('mascota_id').references(() => mascotas.id),
  propietario_id: uuid('propietario_id').references(() => propietarios.id),
  tipo_relacion_id: integer('tipo_relacion_id').references(() => tipos_relacion.id),
  activo: boolean('activo').default(true).notNull(),
  fecha_asociacion: timestamp('fecha_asociacion').defaultNow().notNull(),
});

export const mascotasPropietariosRelations = relations(mascotas_propietarios, ({ one }) => ({
  mascota: one(mascotas, { fields: [mascotas_propietarios.mascota_id], references: [mascotas.id] }),
  propietario: one(propietarios, { fields: [mascotas_propietarios.propietario_id], references: [propietarios.id] }),
}));

export const tipos_relacion = pgTable('tipos_relacion', {
  id: serial('id').primaryKey(),
  tipo: varchar('tipo').notNull().unique(),
  descripcion: text('descripcion'),
});

export const tiposRelacionRelations = relations(tipos_relacion, ({ many }) => ({
  mascotas_propietarios: many(mascotas_propietarios),
}));

export const clinicas_mascotas = pgTable('clinicas_mascotas', {
  clinica_id: uuid('clinica_id').references(() => clinicas.id),
  mascota_id: uuid('mascota_id').references(() => mascotas.id),
  estado_paciente_id: integer('estado_paciente_id').references(() => estados_paciente.id),
  fecha_admision: timestamp('fecha_admision').notNull(),
});

export const clinicasMascotasRelations = relations(clinicas_mascotas, ({ one }) => ({
  clinica: one(clinicas, { fields: [clinicas_mascotas.clinica_id], references: [clinicas.id] }),
  mascota: one(mascotas, { fields: [clinicas_mascotas.mascota_id], references: [mascotas.id] }),
}));

export const estados_paciente = pgTable('estados_paciente', {
  id: serial('id').primaryKey(),
  estado: varchar('estado').notNull().unique(),
  descripcion: text('descripcion'),
});

export const estadosPacienteRelations = relations(estados_paciente, ({ many }) => ({
  clinicas_mascotas: many(clinicas_mascotas),
}));

export const estados_cita = pgTable('estados_cita', {
  id: serial('id').primaryKey(),
  estado: varchar('estado').notNull().unique(),
  descripcion: text('descripcion'),
});

export const estadosCitaRelations = relations(estados_cita, ({ many }) => ({
  citas: many(citas),
}));

export const motivos_cita = pgTable('motivos_cita', {
  id: serial('id').primaryKey(),
  motivo: varchar('motivo').notNull().unique(),
  descripcion: text('descripcion'),
});

export const motivosCitaRelations = relations(motivos_cita, ({ many }) => ({
  citas: many(citas),
}));

export const citas = pgTable('citas', {
  id: uuid('id').defaultRandom().primaryKey(),
  mascota_id: uuid('mascota_id').notNull().references(() => mascotas.id),
  veterinario_id: uuid('veterinario_id').references(() => veterinarios.id),
  clinica_id: uuid('clinica_id').notNull().references(() => clinicas.id),
  fecha_hora: timestamp('fecha_hora').notNull(),
  motivo_id: integer('motivo_id').notNull().references(() => motivos_cita.id),
  estado_cita_id: integer('estado_cita_id').notNull().references(() => estados_cita.id),
});

export const citasRelations = relations(citas, ({ one, many }) => ({
  mascota: one(mascotas, { fields: [citas.mascota_id], references: [mascotas.id] }),
  clinica: one(clinicas, { fields: [citas.clinica_id], references: [clinicas.id] }),
  veterinario: one(veterinarios, { fields: [citas.veterinario_id], references: [veterinarios.id] }),
  estado_cita: one(estados_cita, { fields: [citas.estado_cita_id], references: [estados_cita.id] }),
  motivo_cita: one(motivos_cita, { fields: [citas.motivo_id], references: [motivos_cita.id] }),
  atenciones: many(atenciones),
}));

export const diagnosticos_atencion = pgTable('diagnosticos_atencion', {
  id: serial('id').primaryKey(),
  diagnostico: varchar('diagnostico').notNull().unique(),
  categoria: varchar('categoria'),
});

export const diagnosticosAtencionRelations = relations(diagnosticos_atencion, ({ many }) => ({
  atenciones_diagnosticos: many(atenciones_diagnosticos),
}));

export const atenciones = pgTable('atenciones', {
  id: uuid('id').defaultRandom().primaryKey(),
  cita_id: uuid('cita_id').unique().references(() => citas.id),
  mascota_id: uuid('mascota_id').notNull().references(() => mascotas.id),
  veterinario_id: uuid('veterinario_id').notNull().references(() => veterinarios.id),
  clinica_id: uuid('clinica_id').notNull().references(() => clinicas.id),
  notas_clinicas: text('notas_clinicas'),
  peso_actual: decimal('peso_actual', { precision: 5, scale: 2 }),
  fecha_atencion: timestamp('fecha_atencion').defaultNow().notNull(),
});

export const atencionesRelations = relations(atenciones, ({ one, many }) => ({
  cita: one(citas, { fields: [atenciones.cita_id], references: [citas.id] }),
  mascota: one(mascotas, { fields: [atenciones.mascota_id], references: [mascotas.id] }),
  veterinario: one(veterinarios, { fields: [atenciones.veterinario_id], references: [veterinarios.id] }),
  clinica: one(clinicas, { fields: [atenciones.clinica_id], references: [clinicas.id] }),
  atenciones_diagnosticos: many(atenciones_diagnosticos),
  tratamientos: many(tratamientos),
}));

export const atenciones_diagnosticos = pgTable('atenciones_diagnosticos', {
  atencion_id: uuid('atencion_id').notNull().references(() => atenciones.id),
  diagnostico_id: integer('diagnostico_id').notNull().references(() => diagnosticos_atencion.id),
});

export const atencionesDiagnosticosRelations = relations(atenciones_diagnosticos, ({ one }) => ({
  atencion: one(atenciones, { fields: [atenciones_diagnosticos.atencion_id], references: [atenciones.id] }),
  diagnostico: one(diagnosticos_atencion, { fields: [atenciones_diagnosticos.diagnostico_id], references: [diagnosticos_atencion.id] }),
}));

export const catalogo_productos = pgTable('catalogo_productos', {
  id: serial('id').primaryKey(),
  certificado_senasa: varchar('certificado_senasa').notNull().unique(),
  nombre_comercial: varchar('nombre_comercial').notNull(),
  laboratorio: varchar('laboratorio').notNull(),
  es_vacuna: boolean('es_vacuna').default(false).notNull(),
});

export const catalogoProductosRelations = relations(catalogo_productos, ({ many }) => ({
  vacunas: many(vacunas),
  tratamientos: many(tratamientos),
}));

export const vacunas = pgTable('vacunas', {
  id: uuid('id').defaultRandom().primaryKey(),
  mascota_id: uuid('mascota_id').notNull().references(() => mascotas.id),
  veterinario_id: uuid('veterinario_id').references(() => veterinarios.id),
  atencion_id: uuid('atencion_id').references(() => atenciones.id),
  producto_id: integer('producto_id').notNull().references(() => catalogo_productos.id),
  numero_lote: varchar('numero_lote'),
  fecha_aplicacion: timestamp('fecha_aplicacion').notNull(),
  fecha_proxima_dosis: timestamp('fecha_proxima_dosis'),
});

export const vacunasRelations = relations(vacunas, ({ one }) => ({
  mascota: one(mascotas, { fields: [vacunas.mascota_id], references: [mascotas.id] }),
  veterinario: one(veterinarios, { fields: [vacunas.veterinario_id], references: [veterinarios.id] }),
  producto: one(catalogo_productos, { fields: [vacunas.producto_id], references: [catalogo_productos.id] }),
}));

export const tratamientos = pgTable('tratamientos', {
  id: uuid('id').defaultRandom().primaryKey(),
  atencion_id: uuid('atencion_id').notNull().references(() => atenciones.id),
  tipo_id: integer('tipo_tratamiento_id').notNull().references(() => tipos_tratamiento.id),
  producto_id: integer('producto_id').notNull().references(() => catalogo_productos.id),
  dosis: varchar('dosis').notNull(),
  frecuencia: varchar('frecuencia').notNull(),
  fecha_inicio: timestamp('fecha_inicio').notNull(),
  fecha_fin: timestamp('fecha_fin'),
  indicaciones_adicionales: text('indicaciones_adicionales'),
});

export const tratamientosRelations = relations(tratamientos, ({ one }) => ({
  atencion: one(atenciones, { fields: [tratamientos.atencion_id], references: [atenciones.id] }),
  tipo_tratamiento: one(tipos_tratamiento, { fields: [tratamientos.tipo_id], references: [tipos_tratamiento.id] }),
  producto: one(catalogo_productos, { fields: [tratamientos.producto_id], references: [catalogo_productos.id] }),
}));

export const tipos_tratamiento = pgTable('tipos_tratamiento', {
  id: serial('id').primaryKey(),
  tipo: varchar('tipo').notNull().unique(),
  descripcion: text('descripcion'),
});

export const tiposTratamientoRelations = relations(tipos_tratamiento, ({ many }) => ({
  tratamientos: many(tratamientos),
}));

export const veterinarios_matriculados_cordoba = pgTable('veterinarios_matriculados_cordoba', {
  id: serial('id').primaryKey(),
  nombre_completo: varchar('nombre_completo').notNull(),
  numero_matricula: varchar('numero_matricula').notNull().unique(),
  dni: varchar('dni').notNull().unique(),
  categoria_id: varchar('categoria_id').notNull().references(() => categorias_matriculas.id),
  es_valido: boolean('es_valido').default(true).notNull(),
  actualizado_el: timestamp('actualizado_el').notNull().defaultNow(),
});

export const categorias_matriculas = pgTable('categorias_matriculas', {
  id: varchar('id', { length: 2 }).primaryKey(),
  categoria: varchar('categoria').notNull(),
  cobertura: text('cobertura').notNull(),
});