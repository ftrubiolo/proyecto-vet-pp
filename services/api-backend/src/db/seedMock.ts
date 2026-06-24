import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from './index';
import { sql } from 'drizzle-orm';
import {
  usuarios,
  roles,
  clinicas,
  veterinarios,
  veterinarios_clinicas,
  propietarios,
  especies,
  razas,
  mascotas,
  mascotas_propietarios,
  clinicas_mascotas,
  citas,
  atenciones,
  atenciones_diagnosticos,
  vacuna_protocolo,
  vacuna_serie,
  vacuna_dosis,
  tratamientos,
  diagnosticos_atencion,
  catalogo_productos,
  tipos_relacion,
  estados_paciente,
  estados_cita,
  motivos_cita,
  tipos_tratamiento,
  veterinarios_matriculados_cordoba
} from './schema';

async function main() {
  try {
    console.log('🧹 Limpiando tablas de datos transaccionales y de usuarios...');
    await db.execute(sql`
      TRUNCATE TABLE 
        tratamientos, 
        vacuna_dosis, 
        vacuna_serie, 
        atenciones_diagnosticos, 
        atenciones, 
        citas, 
        clinicas_mascotas, 
        mascotas_propietarios, 
        mascotas, 
        propietarios, 
        veterinarios_clinicas, 
        veterinarios, 
        usuarios 
      CASCADE;
    `);
    console.log('✅ Tablas limpiadas con éxito.');

    // --- 1. Obtener y Validar Datos Maestros ---
    console.log('🔍 Cargando roles, estados y configuraciones maestras...');
    const dbRoles = await db.select().from(roles);
    let adminRole = dbRoles.find(r => r.rol === 'Admin');
    let vetRole = dbRoles.find(r => r.rol === 'Veterinario');
    let propRole = dbRoles.find(r => r.rol === 'Propietario');

    if (!adminRole || !vetRole || !propRole) {
      console.log('⚠️ Roles de usuario faltantes. Insertando roles por defecto...');
      const insertedRoles = await db.insert(roles).values([
        { id: 1, rol: 'Admin', descripcion: 'Developers.' },
        { id: 2, rol: 'Veterinario', descripcion: 'Usuario veterinario matriculado.' },
        { id: 3, rol: 'Propietario', descripcion: 'Usuario dueño de mascota.' }
      ]).onConflictDoNothing().returning();
      
      const refreshedRoles = await db.select().from(roles);
      adminRole = refreshedRoles.find(r => r.rol === 'Admin');
      vetRole = refreshedRoles.find(r => r.rol === 'Veterinario');
      propRole = refreshedRoles.find(r => r.rol === 'Propietario');
    }

    const dbTiposRelacion = await db.select().from(tipos_relacion);
    let tutorPrincipal = dbTiposRelacion.find(tr => tr.tipo === 'Tutor Principal');
    if (!tutorPrincipal) {
      const inserted = await db.insert(tipos_relacion).values({
        tipo: 'Tutor Principal',
        descripcion: 'Persona legalmente responsable del animal.'
      }).returning();
      tutorPrincipal = inserted[0];
    }

    let coPropietario = dbTiposRelacion.find(tr => tr.tipo === 'Co-propietario');
    if (!coPropietario) {
      const inserted = await db.insert(tipos_relacion).values({
        tipo: 'Co-propietario',
        descripcion: 'Familiar, pareja o persona autorizada con acceso a la historia clínica.'
      }).returning();
      coPropietario = inserted[0];
    }

    const dbEstadosPaciente = await db.select().from(estados_paciente);
    let pacienteActivo = dbEstadosPaciente.find(ep => ep.estado === 'Activo');
    if (!pacienteActivo) {
      const inserted = await db.insert(estados_paciente).values({
        estado: 'Activo',
        descripcion: 'El paciente fue admitido a la clínica.'
      }).returning();
      pacienteActivo = inserted[0];
    }

    const dbEstadosCita = await db.select().from(estados_cita);
    let citaAgendada = dbEstadosCita.find(ec => ec.estado === 'Agendada');
    let citaConfirmada = dbEstadosCita.find(ec => ec.estado === 'Confirmada');
    let citaNoShow = dbEstadosCita.find(ec => ec.estado === 'No-Show');
    if (!citaAgendada || !citaConfirmada || !citaNoShow) {
      const inserted = await db.insert(estados_cita).values([
        { estado: 'Agendada', descripcion: 'Turno planificado.' },
        { estado: 'Confirmada', descripcion: 'Turno confirmado.' },
        { estado: 'No-Show', descripcion: 'El paciente no asistió.' }
      ]).returning();
      citaAgendada = inserted.find(i => i.estado === 'Agendada');
      citaConfirmada = inserted.find(i => i.estado === 'Confirmada');
      citaNoShow = inserted.find(i => i.estado === 'No-Show');
    }

    const dbMotivosCita = await db.select().from(motivos_cita);
    let consultaGeneral = dbMotivosCita.find(mc => mc.motivo === 'Consulta General');
    let vacunacion = dbMotivosCita.find(mc => mc.motivo === 'Vacunación');
    if (!consultaGeneral || !vacunacion) {
      const inserted = await db.insert(motivos_cita).values([
        { motivo: 'Consulta General', descripcion: 'Chequeo preventivo general.' },
        { motivo: 'Vacunación', descripcion: 'Aplicación de vacunas.' }
      ]).returning();
      consultaGeneral = inserted.find(i => i.motivo === 'Consulta General');
      vacunacion = inserted.find(i => i.motivo === 'Vacunación');
    }

    const dbTiposTratamiento = await db.select().from(tipos_tratamiento);
    let tratamientoMedicamento = dbTiposTratamiento.find(tt => tt.tipo === 'Medicamento');
    if (!tratamientoMedicamento) {
      const inserted = await db.insert(tipos_tratamiento).values({
        tipo: 'Medicamento',
        descripcion: 'Indicación farmacológica estándar.'
      }).returning();
      tratamientoMedicamento = inserted[0];
    }

    let tratamientoAntiparasitario = dbTiposTratamiento.find(tt => tt.tipo === 'Antiparasitario');
    if (!tratamientoAntiparasitario) {
      const inserted = await db.insert(tipos_tratamiento).values({
        tipo: 'Antiparasitario',
        descripcion: 'Desparasitación interna y externa.'
      }).returning();
      tratamientoAntiparasitario = inserted[0];
    }

    // --- 2. Asegurar Razas y Especies ---
    console.log('🐕 Verificando catálogo de razas...');
    const dbRazas = await db.select().from(razas);
    let goldenRetriever = dbRazas.find(r => r.raza === 'Golden Retriever');
    let mestizoCanino = dbRazas.find(r => r.raza === 'Mestizo / Criollo');
    let canicheToy = dbRazas.find(r => r.raza === 'Caniche Toy');
    let siames = dbRazas.find(r => r.raza === 'Siamés');
    let comunEuropeo = dbRazas.find(r => r.raza === 'Mestizo / Común Europeo');
    let boxer = dbRazas.find(r => r.raza === 'Boxer');
    let persa = dbRazas.find(r => r.raza === 'Persa');

    if (!goldenRetriever || !siames || !comunEuropeo || !boxer || !persa || !canicheToy || !mestizoCanino) {
      console.log('⚠️ Creando especies y razas básicas de soporte...');
      // Intentar insertar especies primero
      await db.insert(especies).values([
        { id: 1, especie: 'Canino' },
        { id: 2, especie: 'Felino' }
      ]).onConflictDoNothing();

      await db.insert(razas).values([
        { especie_id: 1, raza: 'Golden Retriever' },
        { especie_id: 1, raza: 'Mestizo / Criollo' },
        { especie_id: 1, raza: 'Caniche Toy' },
        { especie_id: 1, raza: 'Boxer' },
        { especie_id: 2, raza: 'Siamés' },
        { especie_id: 2, raza: 'Mestizo / Común Europeo' },
        { especie_id: 2, raza: 'Persa' }
      ]).onConflictDoNothing();

      // Recargar de la base de datos
      const refreshedRazas = await db.select().from(razas);
      goldenRetriever = refreshedRazas.find(r => r.raza === 'Golden Retriever');
      mestizoCanino = refreshedRazas.find(r => r.raza === 'Mestizo / Criollo');
      canicheToy = refreshedRazas.find(r => r.raza === 'Caniche Toy');
      siames = refreshedRazas.find(r => r.raza === 'Siamés');
      comunEuropeo = refreshedRazas.find(r => r.raza === 'Mestizo / Común Europeo');
      boxer = refreshedRazas.find(r => r.raza === 'Boxer');
      persa = refreshedRazas.find(r => r.raza === 'Persa');
    }

    // --- 3. Asegurar Diagnósticos y Productos ---
    const dbDiagnostics = await db.select().from(diagnosticos_atencion);
    let otitisExterna = dbDiagnostics.find(d => d.diagnostico === 'Otitis Externa');
    let sano = dbDiagnostics.find(d => d.diagnostico === 'Paciente Sano / Control de Rutina');
    let gastroenteritis = dbDiagnostics.find(d => d.diagnostico === 'Gastroenteritis Aguda Inespecífica');
    let dermatitisAtopica = dbDiagnostics.find(d => d.diagnostico === 'Dermatitis Atópica');
    let parasitosisIntestinal = dbDiagnostics.find(d => d.diagnostico === 'Parasitosis Intestinal');
    let infeccionUrinaria = dbDiagnostics.find(d => d.diagnostico === 'Infección Urinaria');

    if (!otitisExterna || !sano || !gastroenteritis || !dermatitisAtopica || !parasitosisIntestinal || !infeccionUrinaria) {
      console.log('⚠️ Diagnósticos incompletos. Insertando diagnósticos de prueba...');
      await db.insert(diagnosticos_atencion).values([
        { diagnostico: 'Otitis Externa', categoria: 'Dermatología' },
        { diagnostico: 'Paciente Sano / Control de Rutina', categoria: 'Preventivo / General' },
        { diagnostico: 'Gastroenteritis Aguda Inespecífica', categoria: 'Gastroenterología' },
        { diagnostico: 'Dermatitis Atópica', categoria: 'Dermatología' },
        { diagnostico: 'Parasitosis Intestinal', categoria: 'Gastroenterología' },
        { diagnostico: 'Infección Urinaria', categoria: 'Urología' }
      ]).onConflictDoNothing();

      const refreshedDiag = await db.select().from(diagnosticos_atencion);
      otitisExterna = refreshedDiag.find(d => d.diagnostico === 'Otitis Externa');
      sano = refreshedDiag.find(d => d.diagnostico === 'Paciente Sano / Control de Rutina');
      gastroenteritis = refreshedDiag.find(d => d.diagnostico === 'Gastroenteritis Aguda Inespecífica');
      dermatitisAtopica = refreshedDiag.find(d => d.diagnostico === 'Dermatitis Atópica');
      parasitosisIntestinal = refreshedDiag.find(d => d.diagnostico === 'Parasitosis Intestinal');
      infeccionUrinaria = refreshedDiag.find(d => d.diagnostico === 'Infección Urinaria');
    }

    const dbProductos = await db.select().from(catalogo_productos).limit(50);
    let vaccineProduct = dbProductos.find(p => p.nombre_comercial.toLowerCase().includes('vacuna') || p.nombre_comercial.toLowerCase().includes('antirrábica'));
    let otherProduct1 = dbProductos.find(p => !p.nombre_comercial.toLowerCase().includes('vacuna') && p.id !== vaccineProduct?.id);
    let otherProduct2 = dbProductos.find(p => p.id !== vaccineProduct?.id && p.id !== otherProduct1?.id);

    if (!vaccineProduct || !otherProduct1 || !otherProduct2) {
      console.log('⚠️ Productos de catálogo incompletos. Insertando productos de prueba...');
      const insertedProds = await db.insert(catalogo_productos).values([
        { numero_senasa: 'MOCK-V-001', nombre_comercial: 'Vacuna Antirrábica Nobivac', nombre_firma: 'MSD Animal Health' },
        { numero_senasa: 'MOCK-M-002', nombre_comercial: 'Cefalexina 500mg', nombre_firma: 'Brouwer' },
        { numero_senasa: 'MOCK-P-003', nombre_comercial: 'Pipeta Antiparasitaria Power', nombre_firma: 'Labyes' }
      ]).onConflictDoNothing().returning();

      const refreshedProds = await db.select().from(catalogo_productos);
      vaccineProduct = refreshedProds.find(p => p.numero_senasa === 'MOCK-V-001');
      otherProduct1 = refreshedProds.find(p => p.numero_senasa === 'MOCK-M-002');
      otherProduct2 = refreshedProds.find(p => p.numero_senasa === 'MOCK-P-003');
    }

    // --- 4. Asegurar Veterinarios en el Padrón ---
    console.log('📜 Habilitando matrículas de prueba en el padrón oficial de Córdoba...');
    const matriculasParaHabilitar = [
      { nombre_completo: 'ABATE DAGA, DANTE ISMAEL', numero_matricula: '1265', dni: '16.079.171', categoria_id: 'A', es_valido: true },
      { nombre_completo: 'ABAD, VERONICA ROSANA', numero_matricula: '1592', dni: '21.761.993', categoria_id: 'A', es_valido: true },
      { nombre_completo: 'ABATE DAGA, MAXIMILIANO NICOLAS', numero_matricula: '4114', dni: '34.965.218', categoria_id: 'A', es_valido: true }
    ];

    for (const padronVet of matriculasParaHabilitar) {
      await db.insert(veterinarios_matriculados_cordoba)
        .values(padronVet)
        .onConflictDoUpdate({
          target: veterinarios_matriculados_cordoba.numero_matricula,
          set: {
            nombre_completo: padronVet.nombre_completo,
            dni: padronVet.dni,
            categoria_id: padronVet.categoria_id,
            es_valido: padronVet.es_valido
          }
        });
    }

    // --- 5. Generar Contraseñas y Usuarios ---
    console.log('🔑 Cifrando contraseñas de cuentas...');
    const passwordHash = await bcrypt.hash('Password123', 10);

    console.log('👤 Creando usuario administrador...');
    await db.insert(usuarios).values({
      email: 'admin@vetvault.com',
      password_hash: passwordHash,
      rol_id: adminRole!.id
    });

    // --- 6. Crear Veterinarios ---
    console.log('🩺 Insertando perfiles y accesos de Veterinarios...');
    // Dante
    const uDante = await db.insert(usuarios).values({
      email: 'dante.abate@vetvault.com',
      password_hash: passwordHash,
      rol_id: vetRole!.id
    }).returning();
    const vDante = await db.insert(veterinarios).values({
      usuario_id: uDante[0].id,
      nombre: 'Dante',
      apellido: 'Abate Daga',
      numero_matricula: '1265',
      telefono: '3573-456123'
    }).returning();

    // Veronica
    const uVeronica = await db.insert(usuarios).values({
      email: 'veronica.abad@vetvault.com',
      password_hash: passwordHash,
      rol_id: vetRole!.id
    }).returning();
    const vVeronica = await db.insert(veterinarios).values({
      usuario_id: uVeronica[0].id,
      nombre: 'Veronica',
      apellido: 'Abad',
      numero_matricula: '1592',
      telefono: '351-987654'
    }).returning();

    // Maximiliano
    const uMaxi = await db.insert(usuarios).values({
      email: 'maximiliano.abate@vetvault.com',
      password_hash: passwordHash,
      rol_id: vetRole!.id
    }).returning();
    const vMaxi = await db.insert(veterinarios).values({
      usuario_id: uMaxi[0].id,
      nombre: 'Maximiliano',
      apellido: 'Abate Daga',
      numero_matricula: '4114',
      telefono: '3573-112233'
    }).returning();

    // --- 7. Crear Clínicas ---
    console.log('🏢 Creando Clínicas Veterinarias...');
    const cCentro = await db.insert(clinicas).values({
      nombre_comercial: 'Veterinaria Centro',
      direccion: 'Av. Belgrano 250, Córdoba',
      telefono: '0351-4212345'
    }).returning();

    const cHuellas = await db.insert(clinicas).values({
      nombre_comercial: 'Veterinaria Huellas',
      direccion: 'San Martín 780, Villa del Rosario',
      telefono: '03573-421998'
    }).returning();

    // --- 8. Relacionar Veterinarios con Clínicas ---
    console.log('🔗 Conectando profesionales con clínicas...');
    await db.insert(veterinarios_clinicas).values([
      { veterinario_id: vDante[0].id, clinica_id: cCentro[0].id, estado_activo: true },
      { veterinario_id: vDante[0].id, clinica_id: cHuellas[0].id, estado_activo: true },
      { veterinario_id: vVeronica[0].id, clinica_id: cCentro[0].id, estado_activo: true },
      { veterinario_id: vMaxi[0].id, clinica_id: cHuellas[0].id, estado_activo: true }
    ]);

    // --- 9. Crear Propietarios ---
    console.log('👥 Insertando perfiles y accesos de Propietarios...');
    const propietariosData = [
      { email: 'juan.perez@email.com', nombre: 'Juan', apellido: 'Perez', telefono: '3513214567', direccion: 'Colón 1500, Córdoba' },
      { email: 'maria.gomez@email.com', nombre: 'Maria', apellido: 'Gomez', telefono: '3573456789', direccion: 'Sarmiento 120, Villa del Rosario' },
      { email: 'carlos.rod@email.com', nombre: 'Carlos', apellido: 'Rodriguez', telefono: '3516543210', direccion: 'Patria 500, Córdoba' },
      { email: 'ana.martinez@email.com', nombre: 'Ana', apellido: 'Martinez', telefono: '3573987654', direccion: '9 de Julio 340, Villa del Rosario' },
      { email: 'laura.fer@email.com', nombre: 'Laura', apellido: 'Fernandez', telefono: '3511122334', direccion: 'Dean Funes 45, Córdoba' }
    ];

    const propietariosList = [];
    for (const prop of propietariosData) {
      const u = await db.insert(usuarios).values({
        email: prop.email,
        password_hash: passwordHash,
        rol_id: propRole!.id
      }).returning();

      const p = await db.insert(propietarios).values({
        usuario_id: u[0].id,
        nombre: prop.nombre,
        apellido: prop.apellido,
        telefono: prop.telefono,
        direccion: prop.direccion
      }).returning();

      propietariosList.push(p[0]);
    }

    // --- 10. Crear Mascotas ---
    console.log('🐾 Registrando Mascotas y asignando tutores...');
    const getRazaId = (razaObj: typeof razas.$inferSelect | undefined) => {
      return razaObj ? razaObj.id : 1;
    };

    const mascotasData = [
      {
        nombre: 'Toby',
        fecha_nacimiento: new Date('2021-05-10T00:00:00Z'),
        raza_id: getRazaId(goldenRetriever),
        sexo: 'M',
        es_castrado: true,
        numero_microchip: '981020000123456',
        propietario_id: propietariosList[0].id // Juan Perez
      },
      {
        nombre: 'Lola',
        fecha_nacimiento: new Date('2023-02-15T00:00:00Z'),
        raza_id: getRazaId(canicheToy),
        sexo: 'H',
        es_castrado: false,
        numero_microchip: null,
        propietario_id: propietariosList[1].id // Maria Gomez
      },
      {
        nombre: 'Felix',
        fecha_nacimiento: new Date('2020-08-20T00:00:00Z'),
        raza_id: getRazaId(siames),
        sexo: 'M',
        es_castrado: true,
        numero_microchip: '981020000789012',
        propietario_id: propietariosList[2].id // Carlos Rodriguez
      },
      {
        nombre: 'Luna',
        fecha_nacimiento: new Date('2022-11-01T00:00:00Z'),
        raza_id: getRazaId(comunEuropeo),
        sexo: 'H',
        es_castrado: true,
        numero_microchip: null,
        propietario_id: propietariosList[3].id // Ana Martinez
      },
      {
        nombre: 'Rocky',
        fecha_nacimiento: new Date('2019-12-25T00:00:00Z'),
        raza_id: getRazaId(mestizoCanino),
        sexo: 'M',
        es_castrado: true,
        numero_microchip: null,
        propietario_id: propietariosList[4].id // Laura Fernandez
      },
      {
        nombre: 'Mia',
        fecha_nacimiento: new Date('2024-01-10T00:00:00Z'),
        raza_id: getRazaId(comunEuropeo),
        sexo: 'H',
        es_castrado: false,
        numero_microchip: null,
        propietario_id: propietariosList[0].id // Juan Perez (2do)
      },
      {
        nombre: 'Beto',
        fecha_nacimiento: new Date('2022-04-18T00:00:00Z'),
        raza_id: getRazaId(boxer),
        sexo: 'M',
        es_castrado: true,
        numero_microchip: '981020000456789',
        propietario_id: propietariosList[1].id // Maria Gomez (2do)
      },
      {
        nombre: 'Simba',
        fecha_nacimiento: new Date('2021-07-30T00:00:00Z'),
        raza_id: getRazaId(persa),
        sexo: 'M',
        es_castrado: true,
        numero_microchip: null,
        propietario_id: propietariosList[2].id // Carlos Rodriguez (2do)
      }
    ];

    const mascotasList = [];
    for (let i = 0; i < mascotasData.length; i++) {
      const pet = mascotasData[i];
      const m = await db.insert(mascotas).values({
        nombre: pet.nombre,
        fecha_nacimiento: pet.fecha_nacimiento,
        raza_id: pet.raza_id,
        sexo: pet.sexo,
        es_castrado: pet.es_castrado,
        numero_microchip: pet.numero_microchip
      }).returning();

      // Vincular al propietario como principal
      await db.insert(mascotas_propietarios).values({
        mascota_id: m[0].id,
        propietario_id: pet.propietario_id,
        tipo_relacion_id: tutorPrincipal!.id,
        activo: true
      });

      // Si es Toby (índice 0), asignarle un segundo propietario (Co-propietario)
      if (i === 0) {
        await db.insert(mascotas_propietarios).values({
          mascota_id: m[0].id,
          propietario_id: propietariosList[1].id, // Maria Gomez
          tipo_relacion_id: coPropietario!.id,
          activo: true
        });
      }

      // Admitir a la clínica
      const isEven = i % 2 === 0;
      await db.insert(clinicas_mascotas).values({
        clinica_id: isEven ? cCentro[0].id : cHuellas[0].id,
        mascota_id: m[0].id,
        estado_paciente_id: pacienteActivo!.id,
        fecha_admision: new Date()
      });

      // Algunos pacientes se admiten en ambas sucursales
      if (i === 0 || i === 3) {
        await db.insert(clinicas_mascotas).values({
          clinica_id: !isEven ? cCentro[0].id : cHuellas[0].id,
          mascota_id: m[0].id,
          estado_paciente_id: pacienteActivo!.id,
          fecha_admision: new Date()
        });
      }

      mascotasList.push(m[0]);
    }

    // --- 11. Crear Citas ---
    console.log('📅 Planificando Citas (Históricas y Futuras)...');
    const now = new Date();

    // Citas Pasadas
    const pastCitasData = [
      {
        mascota_id: mascotasList[0].id, // Toby
        veterinario_id: vDante[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 días atrás
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[1].id, // Lola
        veterinario_id: vVeronica[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 días atrás
        motivo_id: vacunacion!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[2].id, // Felix
        veterinario_id: vDante[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), // 8 días atrás
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[3].id, // Luna
        veterinario_id: vMaxi[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 días atrás
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaNoShow!.id
      }
    ];

    const pastCitasList = [];
    for (const appt of pastCitasData) {
      const c = await db.insert(citas).values(appt).returning();
      pastCitasList.push(c[0]);
    }

    // Citas Futuras
    const futureCitasData = [
      {
        mascota_id: mascotasList[0].id, // Toby
        veterinario_id: vDante[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // En 3 días
        motivo_id: vacunacion!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[4].id, // Rocky
        veterinario_id: vVeronica[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // En 5 días
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaAgendada!.id
      },
      {
        mascota_id: mascotasList[6].id, // Beto
        veterinario_id: vMaxi[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // En 7 días
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      }
    ];

    for (const appt of futureCitasData) {
      await db.insert(citas).values(appt);
    }

    // Citas para Hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCitasData = [
      {
        mascota_id: mascotasList[5].id, // Mia
        veterinario_id: vVeronica[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        motivo_id: vacunacion!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[7].id, // Simba
        veterinario_id: vDante[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaAgendada!.id
      },
      {
        mascota_id: mascotasList[1].id, // Lola
        veterinario_id: vVeronica[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[4].id, // Rocky
        veterinario_id: vMaxi[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      }
    ];

    for (const appt of todayCitasData) {
      await db.insert(citas).values(appt);
    }

    // Citas para Mañana
    const tomorrowCitasData = [
      {
        mascota_id: mascotasList[3].id, // Luna
        veterinario_id: vMaxi[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0),
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      },
      {
        mascota_id: mascotasList[6].id, // Beto
        veterinario_id: vVeronica[0].id,
        clinica_id: cCentro[0].id,
        fecha_hora: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0),
        motivo_id: vacunacion!.id,
        estado_cita_id: citaAgendada!.id
      },
      {
        mascota_id: mascotasList[2].id, // Felix
        veterinario_id: vDante[0].id,
        clinica_id: cHuellas[0].id,
        fecha_hora: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0),
        motivo_id: consultaGeneral!.id,
        estado_cita_id: citaConfirmada!.id
      }
    ];

    for (const appt of tomorrowCitasData) {
      await db.insert(citas).values(appt);
    }

    // --- 12. Crear Atenciones Clínicas ---
    console.log('🩺 Registrando consultas clínicas, vacunas y tratamientos...');

    // Atencion 1: Toby
    const aToby = await db.insert(atenciones).values({
      cita_id: pastCitasList[0].id,
      mascota_id: mascotasList[0].id,
      veterinario_id: vDante[0].id,
      clinica_id: cCentro[0].id,
      notas_clinicas: 'Control de rutina por pérdida de apetito temporal. El paciente se presenta activo, alerta y responsivo. Mucosas de coloración rosada normal, tiempo de llenado capilar menor a 2 segundos. Al examen físico no se detectan anomalías cardiorrespiratorias ni abdominales. Se sugiere monitorear el consumo de alimento en los próximos días y evitar darle sobras.',
      peso_actual: '32.50',
      fecha_atencion: pastCitasList[0].fecha_hora
    }).returning();

    await db.insert(atenciones_diagnosticos).values({
      atencion_id: aToby[0].id,
      diagnostico_id: sano!.id
    });

    // Vacuna de refuerzo para Toby (nuevo sistema: protocolo → serie → dosis)
    await db.insert(vacuna_protocolo).values({
      senasa_id: vaccineProduct!.id,
      numero_inscripcion: vaccineProduct!.numero_senasa,
      nombre_comercial: vaccineProduct!.nombre_comercial,
      total_dosis_serie_primaria: 1,
      tiene_refuerzo: true,
      refuerzo_cada_dias: 365,
      fecha_validez: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      especies_target: ['Canino'],
      vias_administracion: ['Subcutánea'],
    }).onConflictDoNothing();

    const serieToby = await db.insert(vacuna_serie).values({
      protocolo_id: vaccineProduct!.id,
      mascota_id: mascotasList[0].id,
      veterinario_id: vDante[0].id,
      fecha_inicio: pastCitasList[0].fecha_hora,
      estado_serie: 'completa',
      dosis_aplicadas: 1,
      proximo_refuerzo: new Date(pastCitasList[0].fecha_hora.getTime() + 365 * 24 * 60 * 60 * 1000),
    }).returning();

    await db.insert(vacuna_dosis).values({
      serie_id: serieToby[0].id,
      atencion_id: aToby[0].id,
      numero_dosis: 1,
      fecha_aplicacion: pastCitasList[0].fecha_hora,
      lote: 'L-AB456',
      via_administracion: 'Subcutánea',
    });

    // Desparasitación preventiva para Toby
    await db.insert(tratamientos).values({
      atencion_id: aToby[0].id,
      tipo_id: tratamientoAntiparasitario!.id,
      producto_id: otherProduct2!.id,
      dosis: '1 comprimido',
      frecuencia: 'Dosis única, repetir a los 15 días',
      fecha_inicio: pastCitasList[0].fecha_hora,
      fecha_fin: new Date(pastCitasList[0].fecha_hora.getTime() + 15 * 24 * 60 * 60 * 1000),
      indicaciones_adicionales: 'Administrar con el estómago lleno para evitar náuseas. Repetir dosis en 15 días para completar el ciclo.'
    });

    // Atencion 2: Lola
    const aLola = await db.insert(atenciones).values({
      cita_id: pastCitasList[1].id,
      mascota_id: mascotasList[1].id,
      veterinario_id: vVeronica[0].id,
      clinica_id: cCentro[0].id,
      notas_clinicas: 'Consulta para vacunación anual correspondiente al plan sanitario. Examen clínico previo satisfactorio, temperatura corporal normal (38.4 °C). Sin signos clínicos de enfermedad. Se procede a la aplicación de la vacuna.',
      peso_actual: '4.20',
      fecha_atencion: pastCitasList[1].fecha_hora
    }).returning();

    await db.insert(atenciones_diagnosticos).values({
      atencion_id: aLola[0].id,
      diagnostico_id: sano!.id
    });

    // Vacuna para Lola (mismo protocolo, nueva serie)
    const serieLola = await db.insert(vacuna_serie).values({
      protocolo_id: vaccineProduct!.id,
      mascota_id: mascotasList[1].id,
      veterinario_id: vVeronica[0].id,
      fecha_inicio: pastCitasList[1].fecha_hora,
      estado_serie: 'completa',
      dosis_aplicadas: 1,
      proximo_refuerzo: new Date(pastCitasList[1].fecha_hora.getTime() + 365 * 24 * 60 * 60 * 1000),
    }).returning();

    await db.insert(vacuna_dosis).values({
      serie_id: serieLola[0].id,
      atencion_id: aLola[0].id,
      numero_dosis: 1,
      fecha_aplicacion: pastCitasList[1].fecha_hora,
      lote: 'L-AB123',
      via_administracion: 'Subcutánea',
    });

    // Atencion 3: Felix
    const aFelix = await db.insert(atenciones).values({
      cita_id: pastCitasList[2].id,
      mascota_id: mascotasList[2].id,
      veterinario_id: vDante[0].id,
      clinica_id: cHuellas[0].id,
      notas_clinicas: 'Presenta otitis eritematosa bilateral, con mayor compromiso en el conducto auditivo derecho. El paciente manifiesta molestia y sacude la cabeza frecuentemente. Se observa abundante secreción cerosa oscura. Limpieza exhaustiva en el consultorio y prescripción de gotas óticas antiparasitarias/antibióticas.',
      peso_actual: '5.10',
      fecha_atencion: pastCitasList[2].fecha_hora
    }).returning();

    await db.insert(atenciones_diagnosticos).values({
      atencion_id: aFelix[0].id,
      diagnostico_id: otitisExterna!.id
    });

    await db.insert(tratamientos).values({
      atencion_id: aFelix[0].id,
      tipo_id: tratamientoMedicamento!.id,
      producto_id: otherProduct1!.id,
      dosis: '4 gotas en cada oído',
      frecuencia: 'Cada 12 horas',
      fecha_inicio: pastCitasList[2].fecha_hora,
      fecha_fin: new Date(pastCitasList[2].fecha_hora.getTime() + 7 * 24 * 60 * 60 * 1000),
      indicaciones_adicionales: 'Limpiar suavemente la entrada del conducto auditivo con gasa seca antes de aplicar las gotas. Control clínico en 7 días para evaluar evolución.'
    });

    // Atencion 4: Walk-in Simba (Sin cita previa)
    const aSimba = await db.insert(atenciones).values({
      cita_id: null,
      mascota_id: mascotasList[7].id,
      veterinario_id: vDante[0].id,
      clinica_id: cHuellas[0].id,
      notas_clinicas: 'Traído por guardia debido a vómitos recurrentes (4 episodios) y decaimiento marcado desde hace 24 horas. Mucosas levemente secas, abdomen tenso y doloroso a la palpación media en zona epigástrica. Se administra antiemético inyectable por vía SC en consultorio y se prescribe tratamiento protector de la mucosa gástrica oral.',
      peso_actual: '4.85',
      fecha_atencion: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    }).returning();

    await db.insert(atenciones_diagnosticos).values({
      atencion_id: aSimba[0].id,
      diagnostico_id: gastroenteritis!.id
    });

    await db.insert(tratamientos).values({
      atencion_id: aSimba[0].id,
      tipo_id: tratamientoMedicamento!.id,
      producto_id: otherProduct2!.id,
      dosis: '0.5 ml por vía oral',
      frecuencia: 'Cada 24 horas',
      fecha_inicio: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      fecha_fin: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      indicaciones_adicionales: 'Dieta blanda líquida (pollo hervido y arroz sin condimentos) en porciones muy pequeñas durante las próximas 48 horas. Controlar consumo de agua para evitar deshidratación. Si los vómitos persisten, regresar inmediatamente.'
    });

    console.log('🎉 ¡Carga de datos de prueba completada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la generación de datos de prueba:', error);
    process.exit(1);
  }
}

main();
