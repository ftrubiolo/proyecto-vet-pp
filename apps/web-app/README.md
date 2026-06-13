# VetVault Web Application — Panel de Administración Clínica 🐾

Este subproyecto contiene el frontend web de **VetVault**, un panel de administración clínica y de turnos diseñado para veterinarias. Proporciona una interfaz web moderna, rápida y responsiva para veterinarios, administradores y tutores de mascotas.

---

## 🚀 Tecnologías Principales

- **Framework**: [React 19](https://react.dev/)
- **Entorno de Desarrollo y Empaquetador**: [Vite](https://vite.dev/)
- **Lenguaje**: TypeScript
- **Enrutamiento**: React Router v7 (`react-router-dom`)
- **Estilos**: Vanilla CSS moderno utilizando variables CSS nativas, media queries de preferencia del sistema (modo oscuro automático) y efectos avanzados de Glassmorphism.
- **Iconografía**: [Lucide React](https://lucide.react.dev/)

---

## 📁 Estructura del Proyecto

El código fuente dentro de `src/` se organiza de la siguiente manera:

```
src/
├── api/             # Cliente API base y llamadas de integración HTTP
├── assets/          # Imágenes estáticas y recursos locales
├── components/      # Componentes UI reutilizables y layouts del panel (Header, Sidebar, AuthGuard)
├── context/         # Contextos globales de estado (ej. autenticación de usuario)
├── hooks/           # Hooks personalizados de React para lógica de negocio y consultas
├── pages/           # Vistas de página principales del sistema
│   ├── dashboard/   # Resumen de métricas, recordatorios y agenda diaria
│   ├── mascotas/    # Directorio de pacientes e historial clínico interactivo
│   ├── citas/       # Seguimiento de turnos y agendas médicas
│   ├── perfil/      # Configuración de cuenta e información de matrícula profesional
│   └── login/       # Vista pública de inicio de sesión
├── router.tsx       # Configuración centralizada de rutas públicas y protegidas
├── index.css        # Configuración del motor de temas globales (Light/Dark y variables base)
└── App.css          # Estilos específicos de la aplicación y layouts generales
```

---

## 🎨 Sistema de Diseño (Design Tokens)

La aplicación web de VetVault no utiliza frameworks CSS pesados (como Tailwind) sino que implementa un sistema de diseño propio documentado en [DESIGN.md](file:///home/rei/VetVault/proyecto-vet-pp/apps/web-app/DESIGN.md).

### 1. Colores y Contexto Dinámico de Roles
La interfaz adapta dinámicamente sus tonos de acento dependiendo del contexto del usuario autenticado:
- **Veterinario (`.role-vet`)**: Adopta tonos azules y de alta concentración clínica.
- **Tutor/Propietario (`.role-owner`)**: Adopta tonos verdes y amigables.

### 2. Glassmorphic Cards (Efecto de Cristal)
Los contenedores secundarios (como tarjetas de vacunas, listas e ítems del historial) utilizan desenfoque de fondo y bordes sutiles para crear jerarquía visual:
```css
.vaccine-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  backdrop-filter: blur(8px);
}
```

### 3. Modo Oscuro Automático
El sistema detecta automáticamente la configuración de tema del sistema operativo (`prefers-color-scheme`) y ajusta las variables `--bg`, `--surface`, `--border` y `--text` en consecuencia para ofrecer una experiencia prémium y cómoda.

---

## 🛠️ Instrucciones de Ejecución

### Requisitos Previos
- **Node.js**: Versión 22 o superior.
- **Servicio Backend**: Debe estar ejecutándose en `http://localhost:5000` (el cliente API en `src/api/client.ts` apunta a esta ruta).

### Instalación y Arranque
1. Accede al directorio de la aplicación web:
   ```bash
   cd apps/web-app
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá por defecto en [http://localhost:5173](http://localhost:5173).

### Comandos Disponibles
- `npm run dev`: Inicia el servidor de desarrollo de Vite.
- `npm run build`: Compila y optimiza la aplicación para producción en la carpeta `dist/`.
- `npm run lint`: Ejecuta el analizador de código estático ESLint.
- `npm run preview`: Previsualiza localmente la compilación de producción.
