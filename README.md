# VetVault 🐾

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

## 🛠️ Estructura del Proyecto y Tecnologías

El proyecto está organizado como un **monorrepitorio** con las siguientes divisiones:

### 📱 Aplicaciones (`/apps`)
- **`web-app`**: Panel web de administración y gestión para clínicas, veterinarios y propietarios. Desarrollado con **React**.
- **`mobile-app`**: Aplicación móvil para el uso rápido de los propietarios (consultas de turnos, carnet de vacunación digital).

### ⚙️ Servicios (`/services`)
- **`api-backend`**: API REST centralizada que conecta las aplicaciones con la base de datos.
  - **Framework**: Fastify (Node.js + TypeScript)
  - **Base de Datos**: PostgreSQL
  - **ORM**: Drizzle ORM

---

## 📋 Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:
- **Node.js** (v22.x o superior)
- **PostgreSQL** (o acceso a una base de datos Postgres remota)
- **Git**

---

## 🔧 Instalación y Configuración

Sigue estos pasos para clonar el proyecto y poner en marcha cada uno de los componentes:

### 1. Clonar el repositorio
```bash
git clone https://github.com/ftrubiolo/proyecto-vet-pp.git
cd proyecto-vet-pp
```

### 2. Configurar el Backend (Servicio API)
1. Dirígete al directorio de la API:
   ```bash
   cd services/api-backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en la raíz de `services/api-backend` y configura las siguientes variables:
   ```env
   PORT=5000
   DATABASE_URL="postgres://tu_usuario:tu_contraseña@tu_host:5432/tu_db"
   JWT_SECRET="una_clave_secreta_segura"
   ```
4. Sincroniza la estructura de tu base de datos utilizando Drizzle:
   ```bash
   npm run db:push
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La API correrá por defecto en el puerto `5000` (http://localhost:5000).*

### 3. Configurar el Frontend Web
1. Abre una **nueva terminal** y navega al directorio de la app web:
   ```bash
   cd apps/web-app
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo web:
   ```bash
   npm run dev
   ```

### 4. Configurar la Aplicación Móvil
1. Navega al directorio de la app móvil:
   ```bash
   cd apps/mobile-app
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el entorno de desarrollo móvil:
   ```bash
   npm start
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
