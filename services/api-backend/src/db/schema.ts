import { pgTable, serial, varchar, text, timestamp, integer, boolean, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Roles Table
export const roles = pgTable('Roles', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre').notNull().unique(),
  descripcion: text('descripcion'),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  usuarios: many(usuarios),
}));

// 2. Usuarios Table
export const usuarios = pgTable('Usuarios', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  passwordHash: varchar('passwordHash').notNull(),
  rolId: integer('rolId').notNull().references(() => roles.id),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  rol: one(roles, { fields: [usuarios.rolId], references: [roles.id] }),
  veterinarios: many(veterinarios),
  propietarios: many(propietarios),
}));

// 3. Clinicas Table
export const clinicas = pgTable('Clinicas', {
  id: serial('id').primaryKey(),
  nombreComercial: varchar('nombreComercial').notNull(),
  direccion: varchar('direccion'),
  telefono: varchar('telefono'),
});

export const clinicasRelations = relations(clinicas, ({ many }) => ({
  veterinarios: many(veterinarios),
  citas: many(citas),
}));

// 4. Veterinarios Table
export const veterinarios = pgTable('Veterinarios', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuarioId').notNull().unique().references(() => usuarios.id),
  clinicaId: integer('clinicaId').notNull().references(() => clinicas.id),
  nombre: varchar('nombre').notNull(),
  apellido: varchar('apellido').notNull(),
  numeroMatricula: varchar('numeroMatricula').notNull().unique(),
  telefono: varchar('telefono'),
  fotoUrl: varchar('fotoUrl'),
});

export const veterinariosRelations = relations(veterinarios, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [veterinarios.usuarioId], references: [usuarios.id] }),
  clinica: one(clinicas, { fields: [veterinarios.clinicaId], references: [clinicas.id] }),
  citas: many(citas),
  consultas: many(consultas),
  vacunas: many(vacunas),
}));

// 5. Propietarios Table
export const propietarios = pgTable('Propietarios', {
  id: serial('id').primaryKey(),
  usuarioId: integer('usuarioId').notNull().unique().references(() => usuarios.id),
  nombre: varchar('nombre').notNull(),
  apellido: varchar('apellido').notNull(),
  telefono: varchar('telefono'),
  direccion: varchar('direccion'),
  razonSocial: varchar('razonSocial'),
  fotoUrl: varchar('fotoUrl'),
});

export const propietariosRelations = relations(propietarios, ({ one, many }) => ({
  usuario: one(usuarios, { fields: [propietarios.usuarioId], references: [usuarios.id] }),
  mascotas: many(mascotas),
}));

// 6. Especies Table
export const especies = pgTable('Especies', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre').notNull().unique(),
});

export const especiesRelations = relations(especies, ({ many }) => ({
  razas: many(razas),
}));

// 7. Razas Table
export const razas = pgTable('Razas', {
  id: serial('id').primaryKey(),
  especieId: integer('especieId').notNull().references(() => especies.id),
  nombre: varchar('nombre').notNull(),
});

export const razasRelations = relations(razas, ({ one, many }) => ({
  especie: one(especies, { fields: [razas.especieId], references: [especies.id] }),
  mascotas: many(mascotas),
}));

// 8. Mascotas Table
export const mascotas = pgTable('Mascotas', {
  id: serial('id').primaryKey(),
  propietarioId: integer('propietarioId').notNull().references(() => propietarios.id),
  razaId: integer('razaId').notNull().references(() => razas.id),
  nombre: varchar('nombre').notNull(),
  fechaNacimiento: timestamp('fechaNacimiento').notNull(),
  sexo: varchar('sexo').notNull(), // 'M' o 'H'
  estaCastrado: boolean('estaCastrado').default(false).notNull(),
  fotoUrl: varchar('fotoUrl'),
  numeroChip: varchar('numeroChip'),
});

export const mascotasRelations = relations(mascotas, ({ one, many }) => ({
  propietario: one(propietarios, { fields: [mascotas.propietarioId], references: [propietarios.id] }),
  raza: one(razas, { fields: [mascotas.razaId], references: [razas.id] }),
  citas: many(citas),
  consultas: many(consultas),
  vacunas: many(vacunas),
}));

// 9. Estados Table
export const estados = pgTable('Estados', {
  id: serial('id').primaryKey(),
  estado: varchar('estado').notNull().unique(),
  descripcion: text('descripcion'),
});

export const estadosRelations = relations(estados, ({ many }) => ({
  citas: many(citas),
}));

// 10. Motivos Table
export const motivos = pgTable('Motivos', {
  id: serial('id').primaryKey(),
  motivo: varchar('motivo').notNull().unique(),
  descripcion: text('descripcion'),
});

export const motivosRelations = relations(motivos, ({ many }) => ({
  citas: many(citas),
}));

// 11. Citas Table
export const citas = pgTable('Citas', {
  id: serial('id').primaryKey(),
  mascotaId: integer('mascotaId').notNull().references(() => mascotas.id),
  clinicaId: integer('clinicaId').notNull().references(() => clinicas.id),
  veterinarioId: integer('veterinarioId').references(() => veterinarios.id),
  estadoId: integer('estadoId').notNull().references(() => estados.id),
  fechaHora: timestamp('fechaHora').notNull(),
  motivoId: integer('motivoId').notNull().references(() => motivos.id),
});

export const citasRelations = relations(citas, ({ one, many }) => ({
  mascota: one(mascotas, { fields: [citas.mascotaId], references: [mascotas.id] }),
  clinica: one(clinicas, { fields: [citas.clinicaId], references: [clinicas.id] }),
  veterinario: one(veterinarios, { fields: [citas.veterinarioId], references: [veterinarios.id] }),
  estado: one(estados, { fields: [citas.estadoId], references: [estados.id] }),
  motivo: one(motivos, { fields: [citas.motivoId], references: [motivos.id] }),
  consultas: many(consultas),
}));

// 12. CatalogoDiagnosticos Table
export const catalogoDiagnosticos = pgTable('CatalogoDiagnosticos', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre').notNull().unique(),
  categoria: varchar('categoria'),
});

export const catalogoDiagnosticosRelations = relations(catalogoDiagnosticos, ({ many }) => ({
  consultas: many(consultas),
}));

// 13. Consultas Table
export const consultas = pgTable('Consultas', {
  id: serial('id').primaryKey(),
  citaId: integer('citaId').unique().references(() => citas.id),
  mascotaId: integer('mascotaId').notNull().references(() => mascotas.id),
  veterinarioId: integer('veterinarioId').notNull().references(() => veterinarios.id),
  diagnosticoId: integer('diagnosticoId').notNull().references(() => catalogoDiagnosticos.id),
  fechaConsulta: timestamp('fechaConsulta').defaultNow().notNull(),
  notasClinicas: text('notasClinicas'),
  pesoMedido: decimal('pesoMedido', { precision: 5, scale: 2 }),
});

export const consultasRelations = relations(consultas, ({ one, many }) => ({
  cita: one(citas, { fields: [consultas.citaId], references: [citas.id] }),
  mascota: one(mascotas, { fields: [consultas.mascotaId], references: [mascotas.id] }),
  veterinario: one(veterinarios, { fields: [consultas.veterinarioId], references: [veterinarios.id] }),
  diagnostico: one(catalogoDiagnosticos, { fields: [consultas.diagnosticoId], references: [catalogoDiagnosticos.id] }),
  tratamientos: many(tratamientos),
}));

// 14. CatalogoProductos Table
export const catalogoProductos = pgTable('CatalogoProductos', {
  id: serial('id').primaryKey(),
  certificadoSenasa: varchar('certificadoSenasa').notNull().unique(),
  nombreComercial: varchar('nombreComercial').notNull(),
  laboratorio: varchar('laboratorio').notNull(),
  esVacuna: boolean('esVacuna').default(false).notNull(),
});

export const catalogoProductosRelations = relations(catalogoProductos, ({ many }) => ({
  vacunas: many(vacunas),
  tratamientos: many(tratamientos),
}));

// 15. Vacunas Table
export const vacunas = pgTable('Vacunas', {
  id: serial('id').primaryKey(),
  mascotaId: integer('mascotaId').notNull().references(() => mascotas.id),
  veterinarioId: integer('veterinarioId').references(() => veterinarios.id),
  productoId: integer('productoId').notNull().references(() => catalogoProductos.id),
  fechaAplicacion: timestamp('fechaAplicacion').notNull(),
  fechaProximaDosis: timestamp('fechaProximaDosis'),
  numeroLote: varchar('numeroLote'),
});

export const vacunasRelations = relations(vacunas, ({ one }) => ({
  mascota: one(mascotas, { fields: [vacunas.mascotaId], references: [mascotas.id] }),
  veterinario: one(veterinarios, { fields: [vacunas.veterinarioId], references: [veterinarios.id] }),
  producto: one(catalogoProductos, { fields: [vacunas.productoId], references: [catalogoProductos.id] }),
}));

// 16. Tratamientos Table
export const tratamientos = pgTable('Tratamientos', {
  id: serial('id').primaryKey(),
  consultaId: integer('consultaId').notNull().references(() => consultas.id),
  productoId: integer('productoId').notNull().references(() => catalogoProductos.id),
  dosis: varchar('dosis').notNull(),
  frecuencia: varchar('frecuencia').notNull(),
  fechaInicio: timestamp('fechaInicio').notNull(),
  fechaFin: timestamp('fechaFin'),
});

export const tratamientosRelations = relations(tratamientos, ({ one }) => ({
  consulta: one(consultas, { fields: [tratamientos.consultaId], references: [consultas.id] }),
  producto: one(catalogoProductos, { fields: [tratamientos.productoId], references: [catalogoProductos.id] }),
}));
