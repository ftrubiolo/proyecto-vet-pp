# VetVault Context & Overview 🐾

**VetVault** is a comprehensive clinical management and appointment scheduling platform for veterinary clinics. It connects veterinarians, pet owners (tutores), and clinic administrators in one ecosystem.

---

## 1. What is the App's Purpose?

The main goal of VetVault is to digitize and simplify veterinary care by tracking:
- **Medical Records**: A pet's lifetime clinical consultations, diagnoses, vaccines, and treatments.
- **Appointment Scheduling**: Matching pet owners and their animals with available vets at registered clinics.
- **Regulatory Checks**: Ensuring that only certified, active professionals can register and manage clinical cases.

---

## 2. Who Uses VetVault? (App Actors)

The platform supports three distinct user roles:

1. **Veterinarians (Veterinarios)**
   - The primary users of the **Web Panel**.
   - They register clinical consults, write prescriptions (treatments), administer vaccines, and update pet profiles.
   
2. **Pet Owners (Tutores / Propietarios)**
   - They use the platform to check their pets' digital profiles.
   - They can view past consultations, active prescriptions, vaccine booster calendars, and schedule appointments.
   - *Note:* Access is read-only for medical logs to ensure data integrity.

3. **System Administrators (Administradores)**
   - Manage registration approvals, assign user roles, and update clinic details.

---

## 3. Main Features & Views

The application provides a clean, modern dashboard layout with the following sections:

- **Dashboard**: Shows a welcome panel with quick metrics (e.g., total registered pets, today's appointments, upcoming vaccines) and a timeline of today's schedule.
- **Mascotas (Patients/Pets)**: 
  - A directory of all registered pets showing their age, breed, weight history, and clinical status.
  - Detailed view per pet containing tabs for **Historial Clínico (Consults)**, **Vacunas (Vaccines)**, and **Tratamientos (Prescriptions)**.
- **Citas (Appointments)**: 
  - Displays scheduled visits categorized by status: *Pendiente* (Pending), *Confirmada* (Confirmed), *Completada* (Completed), or *Cancelada* (Canceled).
  - Vets can quickly click "Atender" (Serve) to initiate a consultation from an appointment.
- **Mi Cuenta (Profile)**: 
  - Personal profile options, including clinic associations and professional license (Matrícula) details.

---

## 4. Key Business Rules to Know

- **Veterinarian Verification**: 
  - To prevent unauthorized clinical work, veterinarian accounts are cross-checked with an official registration board list (Córdoba Board directory).
  - **Category A** veterinarians (active independent practice) are automatically verified.
  - **Category B** (public/educational dependency) and **Category C** (administrative/inactive roles) are marked as unverified and blocked from submitting clinical entries.
- **Appointments to Consultations**: 
  - An appointment (`cita`) transitions into a consultation (`atención`) when a veterinarian serves the patient. Inside a consultation, the vet can prescribe medications and record vaccines simultaneously.
- **Catalog Restrictions**: 
  - Products, medicines, and vaccines must match an official catalog verified by national authorities (SENASA) to ensure correct naming, batch tracking, and doses.

---

## 5. Repository Layout

- **`apps/web-app`**: The frontend React administration portal used by veterinarians and administrators.
- **`apps/mobile-app`**: The upcoming React Native application for pet owners.
- **`services/api-backend`**: The database and API service that powers both frontends.

---

## 6. Copiloto Clínico por Inteligencia Artificial (IA)

El ecosistema integra un Copiloto Clínico basado en IA que asiste tanto a profesionales veterinarios como a propietarios de mascotas. Opera mediante un chat contextualizado (RAG) que interactúa con la base de datos a través de llamadas a herramientas (`tool calls`).

### Reglas de Negocio y Seguridad de la IA:
- **Diferenciación de Sugerencias**: En el drawer de chat del frontend (`AIChatDrawer.tsx`), se muestran chips de sugerencia contextuales y aleatorios (tomados de un pool de 10 frases) que cambian según el rol (Veterinarios ven consultas de vademécum o dosis, Propietarios ven consultas de vacunas o triaje de síntomas).
- **Límite de Peticiones (Rate Limiter)**: Un middleware en memoria limita a un máximo de **30 peticiones por minuto** por usuario en la ruta `/api/ai/chat` para evitar abuso de la API de Gemini.
- **Límite de Llamadas a Herramientas (Function Calls)**: Se mitiga el consumo excesivo de tokens y el bucle infinito limitando las llamadas a base de datos de la IA por turno (`MAX_FUNCTION_CALLS`). Las cuotas son:
  - **Veterinario**: Hasta 8 llamadas por pregunta.
  - **Propietario / Tutor**: Hasta 4 llamadas por pregunta.
  - **Administrador**: Hasta 8 llamadas por pregunta.
- **Inferencia de Fechas**: El prompt de sistema instruye al agente a interpretar automáticamente fechas relativas (como "mañana" o "hoy") para programar o buscar turnos.
- **Registro de Auditoría**: Cada ejecución de herramientas por parte de la IA queda registrada en una tabla de auditoría (`audit log`) almacenando el nombre de la tool, parámetros, usuario e ID de sesión.

---

## 7. Suscripciones y Facturación (Mercado Pago)

VetVault cuenta con un módulo de monetización para habilitar las funcionalidades premium según el plan de la veterinaria o profesional independiente.

- **Planes Disponibles**:
  - `independent` (Veterinarios independientes)
  - `clinic_pro` (Clínicas completas con múltiples sucursales/veterinarios)
- **Flujo de Pago**:
  1. El usuario inicia el checkout (`POST /api/suscripciones/checkout`).
  2. Es redirigido a la pasarela oficial de Mercado Pago.
  3. Al confirmarse el pago, Mercado Pago envía un webhook a `/api/suscripciones/webhooks/mercadopago`, el cual actualiza el estado de la suscripción a `activo` en la base de datos.
- **Bypass de Desarrollo**: Para facilitar pruebas locales sin requerir credenciales reales de producción de Mercado Pago, la ruta `/api/suscripciones/dev-bypass` permite activar instantáneamente el plan `clinic_pro` para el usuario autenticado en entornos de desarrollo (`NODE_ENV=dev`).
