# VetVault 

**VetVault** es un ecosistema moderno para la gestión clínica, reserva de citas e historiales médicos para clínicas veterinarias. Ha sido desarrollado como parte del proyecto final de **Prácticas Profesionalizantes I** en el *Instituto Superior Villa del Rosario* (2026).

El sistema conecta en tiempo real a **veterinarios** (que gestionan consultas, recetas, vacunas y fichas), **tutores o propietarios** (que consultan el historial clínico y carnet sanitario de sus mascotas) y **administradores** de las sucursales clínicas.

---

### 📸 Capturas de Pantalla

#### **Panel de Control del Veterinario**  
![Panel de Control del Veterinario](assets/screenshots/vet-dashboard.png)
#### **Ficha del Paciente**  
![Ficha del Paciente](assets/screenshots/pet-profile.png)
#### **Agenda de Turnos**  
![Agenda de Turnos](assets/screenshots/appointment-scheduling.png)
#### **Copiloto IA**  
![Copiloto IA](assets/screenshots/ai-chat.png)

---

## ✨ Características Principales

1. **Gestión de Fichas Médicas**: Registro completo de mascotas (peso, fotos, alergias, contraindicaciones e historial clínico interactivo por pestañas).
2. **Consultas Clínicas (`Atenciones`)**: Permite a los veterinarios registrar notas clínicas, asociar diagnósticos estándares, programar tratamientos y aplicar vacunas simultáneamente.
3. **Control de Prescripciones y Vacunación**:
   - Seguimiento exacto de dosis, frecuencias y fechas de inicio/fin de medicamentos.
   - Carnet sanitario inteligente con cálculo de fechas de refuerzo de vacunas.
4. **Validación de Matrículas**: Integración con el padrón del Colegio de Veterinarios de Córdoba para verificar de forma segura la autenticidad y habilitación clínica de los profesionales en su registro.
5. **Vademécum Oficial (SENASA)**: Integración con el catálogo nacional de medicamentos y vacunas de SENASA para evitar errores de carga y lotes.
6. **Copiloto Clínico por Inteligencia Artificial**:
   - **Consultas Clínicas Contextuales**: Responde preguntas sobre diagnósticos, tratamientos y vacunas usando el historial real del paciente activo (RAG).
   - **Asistencia en Prescripciones**: Ayuda a calcular dosis, verificar interacciones y consultar el vademécum SENASA en lenguaje natural.
   - **Resumen de Historial Clínico**: Genera resúmenes inteligentes de la evolución del paciente, patrones de peso y diagnósticos recurrentes.

---

## 🛠️ Estructura del Monorrepitorio

El proyecto está organizado como un **monorrepitorio** que divide frontends y servicios backend:

```
proyecto-vet-pp/
├── apps/
│   ├── web-app/             # Aplicación React 19 (Vite) para veterinarios y administradores
│   └── mobile-app/          # Aplicación React Native para propietarios/tutores (En desarrollo)
├── packages/
│   └── shared/              # Tipos, interfaces y utilidades compartidas entre servicios
└── services/
    └── api-backend/         # Servidor Fastify (Node.js + TypeScript) y base de datos Postgres
```

---

## ⚙️ Instalación y Arranque Rápido

### Requisitos Previos
- **Node.js** (v22 o superior)
- **PostgreSQL** local o remoto

### Paso 1: Clonar e Instalar Backend
1. Navega al directorio del backend:
   ```bash
   cd services/api-backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea un archivo `.env` en `services/api-backend/` basándote en la siguiente plantilla:
   ```ini
   PORT=5000
   DATABASE_URL="postgres://tu_usuario:tu_contraseña@localhost:5432/vetvault"
   JWT_SECRET="clave_secreta_jwt_muy_segura"
   NODE_ENV="dev"
   ```
4. Inicializa y puebla la base de datos de manera automatizada:
   ```bash
   npm run db:setup        # Resetea, migra y puebla catálogos oficiales (Vets Córdoba / SENASA)
   npm run db:seed-mock    # Opcional: Carga registros falsos para pruebas clínicas locales
   ```
5. Corre la API en modo desarrollo:
   ```bash
   npm run dev             # Levantará el servidor en http://localhost:5000
   ```

### Paso 2: Construir el Paquete Compartido
El frontend web depende del paquete `@vetvault/shared`, por lo que debe compilarse primero:

1. Navega al directorio del paquete compartido:
   ```bash
   cd packages/shared
   ```
2. Instala las dependencias y compila:
   ```bash
   npm install
   npm run build            # Genera los archivos en dist/
   ```

### Paso 3: Instalar y Correr Frontend Web
1. Abre una nueva terminal y dirígete al directorio de la app web:
   ```bash
   cd apps/web-app
   ```
2. Instala las dependencias y corre el empaquetador de Vite:
   ```bash
   npm install
   npm run dev             # Levantará la interfaz web en http://localhost:5173
   ```

---

## 👥 Equipo de Trabajo

- **Rubiolo Facundo** - [@ftrubiolo](https://github.com/ftrubiolo)
- **Tomás Taborda** - [@tabordatomas](https://github.com/tabordatomas)
- **Valentin Hinojosa** - [@valexxarg777](https://github.com/valexxarg777)
- **Ismael Botella** - [@ismaelbotella997](https://github.com/ismaelbotella997)

---

## 🏫 Información Académica

- **Institución**: Instituto Superior Villa del Rosario
- **Materia**: Prácticas Profesionalizantes I
- **Profesor**: Enzo Varela
- **Año**: 2026

---

## 📄 Licencia

Este proyecto ha sido desarrollado exclusivamente con fines académicos para el Instituto Superior Villa del Rosario.
