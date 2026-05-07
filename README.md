# VetApp 🐾

Este proyecto es una aplicación de **Control Veterinario para Mascotas**, desarrollada como parte de la materia **Prácticas Profesionalizantes I** del Instituto Superior Villa del Rosario.

El objetivo principal es brindar una herramienta integral para que dueños de mascotas y veterinarios puedan llevar un seguimiento detallado de la salud, vacunación e historia clínica de los animales.

---

## 🚀 Características Principales
- **Gestión de Perfiles:** Registro detallado de mascotas (nombre, raza, edad, peso, etc.).
- **Historial Clínico:** Registro de consultas, diagnósticos y tratamientos.
- **Calendario de Vacunación:** Notificaciones y seguimiento de próximas vacunas y desparasitaciones.
- **Gestión de Turnos:** Sistema para agendar citas veterinarias.
- **Panel de Usuario:** Interfaz intuitiva tanto para dueños como para profesionales.

---

## 🛠️ Tecnologías Utilizadas
*Este proyecto fue construido con:*

- **Frontend:** React
- **Backend:** Node.js
- **Base de Datos:** Prisma
- **Control de Versiones:** Git & GitHub

---

## 📋 Requisitos Previos
Antes de clonar e instalar la app, asegúrate de tener instalado:
- Node.js v22.x o superior
- Git

---

## 🔧 Instalación y Configuración

El proyecto está dividido en dos directorios principales: **backend** y **frontend**. Debes configurar e iniciar ambos por separado.

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/ftrubiolo/proyecto-vet-pp.git
   cd proyecto-vet-pp
   ```

2. **Configuración del Backend:**
   Abre una terminal y dirígete a la carpeta del backend para instalar las dependencias:
   ```bash
   cd backend
   npm install
   ```
   **Variables de entorno:** Crea un archivo `.env` dentro de la carpeta `backend` (puedes usar `.env.example` como guía si existe) y configura tu variable `DATABASE_URL`.
   
   **Base de datos:** Sincroniza tu esquema de base de datos y genera el cliente de Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   **Iniciar backend:**
   ```bash
   npm run dev
   ```

3. **Configuración del Frontend:**
   Abre una **nueva terminal** (dejando el backend corriendo), dirígete a la carpeta del frontend e instala las dependencias:
   ```bash
   cd frontend
   npm install
   ```
   **Iniciar frontend:**
   ```bash
   npm run dev
   ```

-----

## 👥 Equipo de Trabajo

  - **Rubiolo Facundo** - [@ftrubiolo](https://github.com/ftrubiolo)
  - **Tomás Taborda** - [@tabordatomas](https://github.com/tabordatomas)
  - **Valentin Hinojosa** - [@valexxarg777](https://github.com/valexxarg777)
  - **Ismael Botella** - [@ismaelbotella997](https://github.com/ismaelbotella997)

-----

## 🏫 Información Académica

  - **Institución:** Instituto Superior Villa del Rosario
  - **Materia:** Prácticas Profesionalizantes I
  - **Profesor:** Enzo Varela
  - **Año:** 2026

-----

## 📄 Licencia

Este proyecto es de uso académico para el instituto Instituto Superior Villa del Rosario.
