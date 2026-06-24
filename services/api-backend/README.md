# VetVault API Backend 

API REST robusta construida con Fastify y TypeScript para la gestión clínica integral de VetVault. Maneja la persistencia en PostgreSQL mediante Drizzle ORM, autenticación basada en JWT (cookies HTTP-Only) y lógica de negocio avanzada como la verificación de matrículas y copiloto de Inteligencia Artificial.

---

## 🚀 Tecnologías Principales

- **Runtime**: Node.js & TypeScript
- **Framework Web**: [Fastify](https://fastify.dev/) (conocido por su excelente rendimiento y bajo overhead)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/) (generador de consultas SQL y mapeador de esquemas type-safe)
- **Motor de Base de Datos**: PostgreSQL
- **Autenticación**: JWT firmado mediante cookies HTTP-Only securizadas (`@fastify/cookie`)
- **Documentación de API**: Swagger UI automático (`@fastify/swagger` + `@fastify/swagger-ui`)

---

## 📂 Arquitectura y Estructura del Proyecto

El backend de VetVault adopta una **arquitectura en capas** clásica para lograr separación de responsabilidades y modularidad:

### Capas del Servidor:
1. **Capa de Entrada y Rutas ([src/routes/](file:///home/rei/VetVault/proyecto-vet-pp/services/api-backend/src/routes))**:
   Declara los endpoints HTTP y asocia los middlewares/hooks de autenticación o roles correspondientes (`preHandler`).
2. **Capa de Controladores ([src/controllers/](file:///home/rei/VetVault/proyecto-vet-pp/services/api-backend/src/controllers))**:
   Valida el formato de los datos de entrada (`body`, `params`, `query`), delega la acción lógica a la capa de servicios y formatea la respuesta HTTP con su correspondiente código de estado.
3. **Capa de Servicios ([src/services/](file:///home/rei/VetVault/proyecto-vet-pp/services/api-backend/src/services))**:
   Implementa las reglas y validaciones del negocio de la aplicación (ej. lógica de matrícula, cálculo de próximas vacunas) y ejecuta las consultas correspondientes a la base de datos.
4. **Capa de Datos ([src/db/](file:///home/rei/VetVault/proyecto-vet-pp/services/api-backend/src/db))**:
   Mantiene las declaraciones de esquemas y relaciones en Drizzle ([schema.ts](file:///home/rei/VetVault/proyecto-vet-pp/services/api-backend/src/db/schema.ts)) y gestiona la inicialización de la conexión mediante el cliente SQL.

```
services/api-backend/
├── drizzle/                # Archivos de migración generados por Drizzle Kit (*.sql)
├── scripts/                # Scripts de importación y utilidades de raspado de datos
├── src/                    # Código fuente del backend
│   ├── controllers/        # Controladores (atención, citas, clínicas, mascotas, etc.)
│   ├── db/                 # Esquemas, semillas y scripts de importación (vets/productos)
│   ├── middlewares/        # Middlewares de control de acceso y JWT
│   ├── routes/             # Enrutadores declarativos
│   ├── services/           # Lógica y transacciones de negocio
│   ├── utils/              # Funciones auxiliares y clases de error comunes
│   └── server.ts           # Inicialización y arranque del servidor Fastify
├── tsconfig.json           # Configuración de TypeScript
├── package.json            # Scripts de ejecución y dependencias del sistema
└── drizzle.config.ts       # Configuración global para Drizzle Kit
```

---

## ⚙️ Configuración e Instalación

### 1. Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz de `services/api-backend` con los siguientes campos:
```ini
PORT=5000
DATABASE_URL="postgres://usuario:contraseña@servidor:5432/db"
JWT_SECRET="tu_clave_secreta_para_firmar_tokens_jwt"
NODE_ENV="dev"
```

### 2. Comandos de Base de Datos (Scripts de npm)

El proyecto utiliza Drizzle Kit para sincronizar y poblar la base de datos de manera automatizada. Para más detalles sobre la estructura física de la base de datos, relaciones y el glosario de tablas, consulta la guía de [Estructura de Base de Datos (DATABASE.md)](file:///home/rei/VetVault/proyecto-vet-pp/services/api-backend/DATABASE.md).

*   **`npm run db:setup`** *(Recomendado para primer arranque)*:
    1. Reinicia por completo el esquema de la base de datos PostgreSQL.
    2. Sincroniza los esquemas locales mediante `drizzle-kit push`.
    3. Ejecuta el semillado de tablas maestras (`db:seed`): carga roles del sistema (`Admin`, `Veterinario`, `Propietario`), especies/razas base de caninos/felinos, motivos y estados de turnos, y categorías de matrículas.
    4. Ejecuta el importador de matrículas (`db:import-vets`): parsea y vuelca en la base de datos el padrón oficial del Colegio de Veterinarios de Córdoba (usado para verificar a los profesionales al registrarse).
    5. Ejecuta el importador de vademécum (`db:import-productos`): procesa y carga el vademécum oficial de productos de SENASA (medicamentos, vacunas y sus laboratorios firmantes).
*   **`npm run db:seed-mock`**: Carga registros sintéticos de prueba (clínicas, veterinarios habilitados, propietarios/tutores ficticios, mascotas, citas previas e historiales médicos/atenciones asociadas) para que puedas probar la aplicación localmente sin ingresar datos a mano.
    > [!NOTE]
    > Al cargar tutores temporales que no completaron su registro de usuario formal, el semillador guarda la contraseña temporal `__TEMP_USER_PLACEHOLDER__` en la tabla `usuarios` hasta que el tutor inicie sesión por primera vez y establezca su clave.
*   **`npm run db:reset`**: Limpia y vacía el contenido de todas las tablas de la base de datos sin alterar la estructura física de las mismas.
*   **`npm run db:push`**: Sincroniza directamente los esquemas declarados de TypeScript (`src/db/schema.ts`) con la base de datos física de PostgreSQL.
*   **`npm run db:seed`**: Puebla únicamente las tablas maestras estáticas del sistema (Roles, Razas, Diagnósticos, Estados, Motivos, etc.).
*   **`npm run db:import-vets`**: Parsea e importa localmente el padrón de veterinarios validados de Córdoba.
*   **`npm run db:import-productos`**: Parsea e importa localmente el vademécum de productos y fármacos autorizados de la base de datos del SENASA.

### 3. Ejecutar el Backend
```bash
# Instalar dependencias
npm install

# Preparar base de datos
npm run db:setup
npm run db:seed-mock

# Iniciar servidor en modo desarrollo (http://localhost:5000)
npm run dev
```

---

## 🔒 Autenticación y Seguridad

La seguridad está basada en **JSON Web Tokens (JWT)**.
- Al iniciar sesión (`/api/auth/login`), se genera un token JWT firmado y se establece en el navegador como una cookie securizada `token` (con propiedades `HttpOnly` y `Secure`).
- Los endpoints protegidos aplican el hook `verifyToken` para validar el JWT y `checkRole` para filtrar el acceso por roles (`Admin`, `Veterinario`, `Propietario`).

---

## 🛠️ Catálogo de Endpoints

### 🔑 Autenticación (`/api/auth`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/veterinario` | Público | Registra una cuenta de usuario y su perfil de Veterinario. |
| `POST` | `/api/auth/register/veterinario/unirse` | Público | Registra una cuenta de usuario y asocia el veterinario a una clínica. |
| `POST` | `/api/auth/register/propietario` | Público | Registra una cuenta de usuario y su perfil de Propietario. |
| `GET` | `/api/auth/validar-matricula` | Público | Verifica la validez de una matrícula profesional en el padrón del Colegio de Veterinarios. |
| `POST` | `/api/auth/login` | Público | Autentica al usuario, genera el JWT y establece la cookie `token`. |
| `POST` | `/api/auth/logout` | Público | Limpia la cookie `token` cerrando la sesión del usuario. |

---

### 👤 Usuarios (`/api/usuarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/usuarios` | `Admin` | Obtiene la lista completa de todos los usuarios registrados. |
| `GET` | `/api/usuarios/me` | Autenticado | Retorna los detalles de la sesión del usuario actualmente logueado. |
| `GET` | `/api/usuarios/:id` | `Admin` | Obtiene los detalles de un usuario específico. |
| `PATCH` | `/api/usuarios/:id` | Autenticado | Actualiza el correo electrónico y/o contraseña de una cuenta de usuario. |

---

### 🏥 Clínicas (`/api/clinicas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/clinicas` | Autenticado | Lista todas las clínicas veterinarias registradas. |
| `GET` | `/api/clinicas/mascota/:mascotaId` | Autenticado | Retorna las clínicas asociadas al historial de una mascota. |
| `GET` | `/api/clinicas/:id` | Autenticado | Retorna los detalles de una clínica en particular. |
| `POST` | `/api/clinicas/:id/admision` | `Veterinario` | Admite temporalmente a una mascota en la clínica (cambia estado a 'Activo' en `clinicas_mascotas`). |
| `POST` | `/api/clinicas` | `Admin` | Registra una nueva sucursal o clínica en el sistema. |
| `PATCH` | `/api/clinicas/:id` | `Admin`, `Veterinario` | Actualiza la información de una clínica (dirección, teléfono, etc.). |

---

### 🥼 Veterinarios (`/api/veterinarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/veterinarios` | Autenticado | Lista todos los veterinarios registrados en el sistema. |
| `GET` | `/api/veterinarios/:id` | `Veterinario`, `Admin` | Retorna la ficha detallada de un veterinario específico. |
| `GET` | `/api/veterinarios/clinica/:clinicaId` | Autenticado | Obtiene el listado de veterinarios que atienden en una clínica específica. |
| `POST` | `/api/veterinarios/invitar` | `Veterinario`, `Admin` | Genera un token de invitación JWT para asociar otro veterinario a la clínica. |
| `PATCH` | `/api/veterinarios/:id` | `Veterinario`, `Admin` | Actualiza datos del perfil (foto, teléfono, matrícula). |
| `GET` | `/api/veterinarios/:id/horarios` | `Veterinario`, `Admin` | Obtiene la agenda de horarios de atención cargados para el veterinario. |
| `PUT` | `/api/veterinarios/:id/clinicas/:clinicaId/horarios` | `Veterinario`, `Admin` | Registra o actualiza la grilla horaria semanal de atención para una clínica. |

---

### 👥 Propietarios / Tutores (`/api/propietarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/propietarios` | `Admin` | Obtiene el listado general de propietarios registrados. |
| `GET` | `/api/propietarios/buscar` | `Admin`, `Veterinario` | Busca perfiles de tutores por coincidencia de email o texto (para registro rápido). |
| `GET` | `/api/propietarios/mascotas` | Autenticado | Obtiene el listado de mascotas del tutor logueado. |
| `GET` | `/api/propietarios/:id` | Autenticado | Retorna los detalles de un propietario específico, sus datos de usuario y mascotas asociadas. |
| `PATCH` | `/api/propietarios/:id` | `Admin`, `Propietario` | Actualiza datos del perfil (teléfono, dirección, es_empresa, etc.). |

---

### 🐶 Mascotas (`/api/mascotas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mascotas` | Autenticado | Lista las mascotas autorizadas (Admin: todas; Vet: pacientes atendidos; Propietario: propias). |
| `GET` | `/api/mascotas/buscar-existente/:id` | `Veterinario`, `Admin` | Retorna información puntual del animal para verificar duplicados. |
| `GET` | `/api/mascotas/:id` | Autenticado | Retorna la ficha médica detallada de una mascota específica. |
| `POST` | `/api/mascotas` | Autenticado | Registra una nueva mascota y establece la relación con su propietario/tutor. |
| `PATCH` | `/api/mascotas/:id` | Autenticado | Modifica datos básicos de la mascota (nombre, foto, alergias, castración). |

---

### 📅 Citas / Turnos (`/api/citas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/citas` | Autenticado | Lista las citas programadas (filtrables por veterinario, propietario o clínica). |
| `GET` | `/api/citas/disponibilidad` | Autenticado | Obtiene los slots de turnos disponibles de un veterinario en una clínica y fecha dada. |
| `POST` | `/api/citas` | Autenticado | Reserva o programa una nueva cita médica. |
| `PATCH` | `/api/citas/:id` | Autenticado | Modifica los detalles de una cita o cambia su estado (*Pendiente*, *Confirmada*, *Cancelada*, *Completada*). |

---

### 📋 Atenciones / Consultas Clínicas (`/api/atenciones`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/atenciones` | `Veterinario` | Lista las atenciones registradas en el ecosistema. |
| `GET` | `/api/mascotas/:mascotaId/atenciones` | Autenticado | Retorna el historial clínico cronológico completo de una mascota. |
| `GET` | `/api/atenciones/:id` | Autenticado | Obtiene los detalles de una consulta específica (diagnósticos, recetas y vacunas asociadas). |
| `POST` | `/api/atenciones` | `Veterinario` | Registra una nueva consulta médica (atención) junto con diagnósticos, recetas de tratamientos y aplicaciones de vacunas en la misma sesión. |
| `GET` | `/api/atenciones/:id/pdf` | Autenticado | Genera y descarga el resumen clínico de la atención en formato PDF. |

---

### 💊 Tratamientos / Prescripciones (`/api/tratamientos`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tratamientos/mascota/:mascotaId` | Autenticado | Obtiene el listado de tratamientos/recetas asignados a una mascota específica. |
| `PATCH` | `/api/tratamientos/:id` | `Admin`, `Veterinario` | Modifica una prescripción activa (ej. fecha de finalización o dosis). |
| `GET` | `/api/tratamientos/:id/pdf` | Autenticado | Genera y descarga la receta médica prescrita en formato PDF. |

---

### 💉 Vacunas (`/api/vacunas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vacunas/mascota/:mascotaId` | Autenticado | Obtiene el carnet sanitario e historial de vacunación de una mascota específica. |
| `GET` | `/api/vacunas/protocolo/producto/:productoId` | `Admin`, `Veterinario` | Retorna el esquema o protocolo de dosis sugerido para un producto/vacuna. |
| `POST` | `/api/vacunas/protocolo` | `Admin`, `Veterinario` | Registra o actualiza el protocolo oficial para una vacuna específica. |

---

### 📦 Catálogos y Tablas Maestras (`/api/catalogo`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/catalogo/diagnosticos` | Autenticado | Retorna el listado de diagnósticos clínicos predefinidos en el sistema. |
| `GET` | `/api/catalogo/tipos-tratamiento` | Autenticado | Lista las categorías de tratamientos (Medicamento, Cirugía, Dieta, etc.). |
| `GET` | `/api/catalogo/productos` | Autenticado | Lista todos los productos y fármacos importados del catálogo de SENASA. |
| `GET` | `/api/catalogo/productos/vacunas` | Autenticado | Filtra y lista únicamente las vacunas disponibles. |
| `GET` | `/api/catalogo/productos/medicamentos` | Autenticado | Filtra y lista únicamente los medicamentos (fármacos no-vacunas). |
| `GET` | `/api/catalogo/especies` | Autenticado | Obtiene el listado de especies y sus razas asociadas anidadas. |
| `GET` | `/api/catalogo/citas/motivos` | Autenticado | Retorna los motivos de turnos (Consulta General, Urgencia, Cirugía, etc.). |
| `GET` | `/api/catalogo/citas/estados` | Autenticado | Retorna los estados válidos de citas (Agendada, Confirmada, Cancelada, etc.). |
| `GET` | `/api/catalogo/pacientes/estados` | Autenticado | Lista los estados del paciente en una clínica (Pre-registrado, Activo, Inactivo). |
| `GET` | `/api/catalogo/mascotas/tipos-relacion`| Autenticado | Lista las relaciones entre mascota y tutor (Tutor Principal, Co-propietario, etc.). |

---

### 💳 Suscripciones (`/api/suscripciones`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/suscripciones/checkout` | Autenticado | Crea y retorna la sesión de cobro/checkout de Mercado Pago para los planes `clinic_pro` o `independent`. |
| `GET` | `/api/suscripciones/mi-suscripcion` | Autenticado | Retorna los datos de vigencia y plan de la suscripción del usuario. |
| `POST` | `/api/suscripciones/webhooks/mercadopago` | Público | Endpoint IPN para procesar eventos y pagos confirmados de Mercado Pago. |
| `POST` | `/api/suscripciones/dev-bypass` | Autenticado | *(Solo modo Dev)* Asigna instantáneamente el plan Clinic Pro al usuario para simplificar pruebas. |

---

### 📁 Subida de Archivos (`/api/upload`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Autenticado | Recibe un archivo adjunto (form-data) y lo guarda en el servidor local retornando la URL estática. |

---

### 🦾 Inteligencia Artificial (`/api/ai`)

El Copiloto Clínico de VetVault funciona de manera centralizada mediante un agente conversacional inteligente.

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Autenticado | Envía una consulta de chat al Copiloto IA junto con el historial previo y contexto (`activeMascotaId`). El agente ejecuta herramientas (tool calls) en base a su rol para resolver la inquietud. |
| `POST` | `/api/ai/pdf` | Autenticado | Genera un archivo PDF a partir del título y contenido de la sesión de chat con la IA. |

> [!NOTE]
> Las peticiones al endpoint `/api/ai/chat` están sujetas a un rate limit estricto de 30 solicitudes por minuto por usuario para preservar los límites de la API de Gemini. Además, el presupuesto de llamadas de herramientas (`MAX_FUNCTION_CALLS`) se restringe por rol (Veterinarios/Admins: 8; Propietarios: 4) y cada invocación es auditada.

---
## 🔗 APIs Externas e Integraciones Oficiales (SENASA)

Para garantizar consistencia y validez científica, el catálogo de productos de VetVault se sincroniza con el Directorio Oficial de Fármacos de SENASA. A continuación se listan las URLs de consulta pública utilizadas para la alimentación del catálogo:

- **Búsqueda Detallada de Productos (Fármacos/Vacunas)**:
  `https://aps2.senasa.gov.ar/adt_api/api/productosFarmacos/search/publicSearchProducto?producto=...`
- **Descarga de Catálogo Completo**:
  `https://aps2.senasa.gov.ar/adt_api/api/productosFarmacos/search/publicSearchProductoFarmacoDTO?page=0&size=6908`
- **Categorías y Tipos de Productos (Fármacos Veterinarios)**:
  `https://aps2.senasa.gov.ar/adt_api/api/enfermedades/search/publicSearchByTipoProducto?tipoProducto=https%3A%2F%2Faps2.senasa.gov.ar%2Fadt_api%2Fapi%2FtiposProductos%2F5`
