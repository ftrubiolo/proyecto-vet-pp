# API VetVault

API REST para la gestión de clínicas veterinarias, veterinarios, propietarios, mascotas, citas e historias clínicas de VetVault.

---

## 🚀 Tecnologías
- **Runtime**: Node.js (TypeScript)
- **Framework**: Fastify
- **Database ORM**: Drizzle ORM
- **Motor de Base de Datos**: PostgreSQL
- **Autenticación**: JWT (Cookies HTTP-Only)

---

## 🔒 Autenticación y Seguridad
La mayoría de los endpoints requieren que el usuario esté autenticado. 
- Los tokens JWT se envían y validan automáticamente a través de la cookie `token` (HTTP-Only).
- En endpoints con roles específicos (`preHandler: [checkRole([...])]`), el token debe pertenecer a un usuario con dicho rol (ej. `Veterinario`, `Propietario`, `Admin`).

---

## 🛠️ Catálogo de Endpoints

### 🔑 Autenticación (`/api/auth`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/veterinario` | Público | Registra una cuenta de usuario y su perfil de Veterinario. |
| `POST` | `/api/auth/register/veterinario/unirse` | Público | Registra una cuenta de usuario y une el veterinario a una clínica. |
| `POST` | `/api/auth/register/propietario` | Público | Registra una cuenta de usuario y su perfil de Propietario. |
| `POST` | `/api/auth/login` | Público | Autentica al usuario, genera el JWT y establece la cookie `token`. Retorna los datos del usuario. |
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
| `GET` | `/api/clinicas` | `Veterinario`, `Admin` | Lista todas las clínicas registradas. |
| `GET` | `/api/clinicas/:id` | Autenticado | Retorna los detalles de una clínica. |
| `POST` | `/api/clinicas/:id/admision` | `Veterinario` | Envía el token o código QR del pasaporte de la mascota para cambiar el estado en clinicas_mascotas a 'Activo'. |
| `POST` | `/api/clinicas` | `Admin` | Crea una nueva sucursal o clínica veterinaria. |
| `PATCH` | `/api/clinicas/:id` | `Admin` | Actualiza la información de una clínica (dirección, teléfono, etc). |

---

### 🥼 Veterinarios (`/api/veterinarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/veterinarios` | Autenticado | Lista todos los veterinarios. |
| `GET` | `/api/veterinarios/:id` | Autenticado | Retorna la ficha detallada de un veterinario. |
| `POST` | `/api/veterinarios/invitar` | `Veterinario`, `Admin` | Genera un token de invitación JWT para que otro veterinario se una a una clínica. |
| `PATCH` | `/api/veterinarios/:id` | `Veterinario` (propio), `Admin` | Actualiza datos del perfil (foto, teléfono, matrícula). |

---

### 👥 Propietarios (`/api/propietarios`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/propietarios` | `Admin` | Obtiene el listado completo de propietarios. |
| `GET` | `/api/propietarios/:id` | Autenticado | Retorna los detalles de un propietario, incluyendo su cuenta de usuario y mascotas asociadas. |
| `PATCH` | `/api/propietarios/:id` | `Propietario` (propio), `Admin` | Actualiza datos del perfil (teléfono, dirección, es_empresa, etc). |
| `DELETE` | `/api/propietarios/:id` | `Admin` | Elimina la ficha de propietario del sistema. |

---

### 🐶 Mascotas (`/api/mascotas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mascotas` | `Veterinario`, `Admin` | Lista todas las mascotas en el sistema. |
| `GET` | `/api/mascotas/:id` | Autenticado | Retorna la ficha médica/perfil de una mascota específica. |
| `POST` | `/api/mascotas` | `Veterinario`, `Propietario`, `Admin` | Registra una nueva mascota y la asocia a un propietario. |
| `PATCH` | `/api/mascotas/:id` | `Veterinario` (paciente), `Propietario` (propio), `Admin` | Modifica los datos de la mascota (nombre, peso estimado, foto, castración). |
| `DELETE` | `/api/mascotas/:id` | `Admin` | Elimina una mascota del sistema. |

---

### 📅 Citas (`/api/citas`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/citas` | Autenticado | Lista las citas programadas (filtrables por veterinario, propietario o clínica). |
| `POST` | `/api/citas` | Autenticado | Programa una nueva cita para una mascota. |
| `PATCH` | `/api/citas/:id` | Autenticado | Modifica los detalles de una cita (reprogramación) o cambia su estado (Pendiente, Confirmada, Cancelada, Completada). |
| `DELETE` | `/api/citas/:id` | Autenticado | Cancela una cita médica. |

---

### 📋 Atenciones / Consultas Clínicas (`/api/atenciones`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/atenciones` | `Veterinario`, `Admin` | Lista el historial completo de atenciones realizadas en el sistema. |
| `GET` | `/api/mascotas/:mascotaId/atenciones` | Autenticado | Obtiene la historia clínica cronológica completa de una mascota específica. |
| `GET` | `/api/atenciones/:id` | Autenticado | Obtiene el detalle completo de una consulta (diagnósticos, vacunas colocadas y tratamientos indicados). |
| `POST` | `/api/atenciones` | `Veterinario` | Registra una nueva consulta médica, permitiendo asociar diagnósticos, tratamientos y vacunas aplicadas en la sesión. |

---

### 📦 Catálogos (`/api/catalogo`)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/catalogo/productos` | Autenticado | Lista los productos, medicamentos y vacunas disponibles (Catálogo SENASA). |
| `GET` | `/api/catalogo/diagnosticos` | Autenticado | Lista los diagnósticos clínicos estándar predefinidos en el sistema. |
| `GET` | `/api/catalogo/especies` | Autenticado | Obtiene las especies disponibles (ej. Canino, Felino). |
| `GET` | `/api/catalogo/razas` | Autenticado | Obtiene las razas correspondientes a una especie. |

---

### 🦾 Los Casos de Uso del "Copiloto de IA" (Macro-Módulo 3)

| Método | Ruta | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/atenciones/escribano-voz` | `Veterinario` | Recibe el archivo de audio grabado por el veterinario en el box, lo sube a AWS S3 y dispara la petición a Gemini 2.5 Flash para que devuelva el JSON estructurado antes de impactar la base de datos. |
| `POST` | `/api/ia/triaje` | `Veterinario` | Endpoint para el Triaje Sintomático Asistido. Recibe el texto en lenguaje natural del tutor (ej: "Toby vomita..."), lo procesa y devuelve el grado de urgencia médica y el descargo de responsabilidad (Disclaimer). |
