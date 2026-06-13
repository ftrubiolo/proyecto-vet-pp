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
