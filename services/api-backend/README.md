# VetVault API Backend 🐾

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
El proyecto utiliza Drizzle Kit para sincronizar y poblar la base de datos de manera automatizada:
- **`npm run db:setup`** *(Recomendado)*: Realiza un reinicio completo de la base de datos, aplica el esquema, carga los diagnósticos/roles iniciales e importa los directorios externos de veterinarios matriculados y el catálogo nacional de medicamentos (SENASA).
- **`npm run db:seed-mock`**: Carga datos simulados (veterinarios, propietarios, mascotas, citas y consultas previas) para facilitar las pruebas locales.
- **`npm run db:reset`**: Limpia todas las tablas de la base de datos.
- **`npm run db:push`**: Sincroniza directamente los esquemas de TypeScript con la base de datos de PostgreSQL.
- **`npm run db:seed`**: Carga las tablas maestras principales (Roles, Razas, Diagnósticos, Estados de Citas, etc.).
- **`npm run db:import-vets`**: Ejecuta el script de importación del padrón de veterinarios validados de Córdoba.
- **`npm run db:import-productos`**: Importa el vademécum nacional del SENASA.

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
| `POST` | `/api/auth/login` | Público | Autentica al usuario, genera el JWT y establece la cookie `token`. |
| `POST` | `/api/auth/logout` | Público | Limpia la cookie `token` cerrando la sesión del usuario. |

---

### 👤 Usuarios (`/api/usuarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/usuarios` | `Admin` | Obtiene la lista completa de todos los usuarios registrados. |
| `GET` | `/api/usuarios/me` | Autenticado | Retorna los detalles de la sesión del usuario actualmente logueado. |
| `GET` | `/api/usuarios/:id` | `Admin` | Obtiene los detalles de un usuario específico. |

---

### 🏥 Clínicas (`/api/clinicas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/clinicas` | `Veterinario` | Lista todas las clínicas veterinarias registradas. |
| `GET` | `/api/clinicas/:id` | Autenticado | Retorna los detalles de una clínica en particular. |
| `POST` | `/api/clinicas/:id/admision` | `Veterinario` | Admite temporalmente a una mascota en la clínica (cambia estado a 'Activo' en `clinicas_mascotas`). |
| `POST` | `/api/clinicas` | `Admin` | Registra una nueva sucursal o clínica en el sistema. |
| `PATCH` | `/api/clinicas/:id` | `Admin` | Actualiza la información de una clínica (dirección, teléfono, etc.). |

---

### 🥼 Veterinarios (`/api/veterinarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/veterinarios` | Autenticado | Lista todos los veterinarios. |
| `GET` | `/api/veterinarios/:id` | Autenticado | Retorna la ficha detallada de un veterinario. |
| `POST` | `/api/veterinarios/invitar` | `Veterinario` | Genera un token de invitación JWT para asociar otro veterinario a la clínica. |
| `PATCH` | `/api/veterinarios/:id` | `Veterinario` (propio) | Actualiza datos del perfil (foto, teléfono, matrícula). |

---

### 👥 Propietarios / Tutores (`/api/propietarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/propietarios` | `Admin` | Obtiene el listado de propietarios del sistema. |
| `GET` | `/api/propietarios/:id` | Autenticado | Retorna los detalles de un propietario, sus datos de usuario y mascotas asociadas. |
| `PATCH` | `/api/propietarios/:id` | `Propietario` (propio) | Actualiza datos del perfil (teléfono, dirección, es_empresa, etc.). |
| `DELETE` | `/api/propietarios/:id` | `Admin` | Elimina la ficha de propietario del sistema. |

---

### 🐶 Mascotas (`/api/mascotas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mascotas` | `Veterinario` | Lista todas las mascotas en el sistema. |
| `GET` | `/api/mascotas/:id` | Autenticado | Retorna la ficha médica detallada de una mascota específica. |
| `POST` | `/api/mascotas` | `Veterinario`, `Propietario` | Registra una nueva mascota y establece su propietario. |
| `PATCH` | `/api/mascotas/:id` | `Veterinario` (paciente), `Propietario` (propio) | Modifica datos básicos de la mascota (nombre, foto, alergias, castración). |
| `DELETE` | `/api/mascotas/:id` | `Admin` | Elimina una mascota del sistema. |

---

### 📅 Citas / Turnos (`/api/citas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/citas` | Autenticado | Lista las citas programadas (filtrables por veterinario, propietario o clínica). |
| `POST` | `/api/citas` | Autenticado | Reserva o programa una nueva cita médica. |
| `PATCH` | `/api/citas/:id` | Autenticado | Modifica los detalles de una cita o cambia su estado (*Pendiente*, *Confirmada*, *Cancelada*, *Completada*). |
| `DELETE` | `/api/citas/:id` | Autenticado | Elimina/cancela permanentemente una cita. |

---

### 📋 Atenciones / Consultas Clínicas (`/api/atenciones`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/atenciones` | `Veterinario` | Lista las atenciones registradas en el ecosistema. |
| `GET` | `/api/mascotas/:mascotaId/atenciones` | Autenticado | Retorna el historial clínico cronológico completo de una mascota. |
| `GET` | `/api/atenciones/:id` | Autenticado | Obtiene los detalles de una consulta específica (incluye diagnósticos, recetas y vacunas asociadas). |
| `POST` | `/api/atenciones` | `Veterinario` | Registra una nueva consulta médica (atención) junto con diagnósticos, recetas de tratamientos y aplicaciones de vacunas en la misma sesión. |

---

### 💊 Tratamientos / Prescripciones (`/api/tratamientos`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tratamientos/mascota/:mascotaId` | Autenticado | Obtiene el listado de tratamientos/recetas asignados a una mascota específica. |
| `PATCH` | `/api/tratamientos/:id` | `Admin`, `Veterinario` | Modifica una prescripción activa (ej. fecha de finalización o dosis). |

---

### 💉 Vacunas (`/api/vacunas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vacunas/mascota/:mascotaId` | Autenticado | Obtiene el carnet sanitario e historial de vacunación de una mascota específica. |

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

### 🦾 Casos de Uso con Inteligencia Artificial

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/atenciones/escribano-voz` | `Veterinario` | Recibe audio grabado del box clínico, lo sube a AWS S3 y utiliza Gemini 2.5 Flash para extraer y estructurar automáticamente los diagnósticos y tratamientos en formato JSON antes de impactarlos. |
| `POST` | `/api/ia/triaje` | `Veterinario` | Triaje sintomático asistido. Evalúa síntomas expresados en lenguaje natural por el tutor y estima la urgencia médica recomendando acciones preventivas o atención inmediata. |

---

## 🔗 APIs Externas e Integraciones Oficiales (SENASA)

Para garantizar consistencia y validez científica, el catálogo de productos de VetVault se sincroniza con el Directorio Oficial de Fármacos de SENASA. A continuación se listan las URLs de consulta pública utilizadas para la alimentación del catálogo:

- **Búsqueda Detallada de Productos (Fármacos/Vacunas)**:
  `https://aps2.senasa.gov.ar/adt_api/api/productosFarmacos/search/publicSearchProducto?producto=...`
- **Descarga de Catálogo Completo**:
  `https://aps2.senasa.gov.ar/adt_api/api/productosFarmacos/search/publicSearchProductoFarmacoDTO?page=0&size=6908`
- **Categorías y Tipos de Productos (Fármacos Veterinarios)**:
  `https://aps2.senasa.gov.ar/adt_api/api/enfermedades/search/publicSearchByTipoProducto?tipoProducto=https%3A%2F%2Faps2.senasa.gov.ar%2Fadt_api%2Fapi%2FtiposProductos%2F5`
