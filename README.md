# VetVault 🐾 — Sistema Integral de Gestión Veterinaria

**VetVault** es un ecosistema moderno para la gestión clínica, reserva de citas e historiales médicos para clínicas veterinarias. Ha sido desarrollado como parte del proyecto final de **Prácticas Profesionalizantes I** en el *Instituto Superior Villa del Rosario* (2026).

El sistema conecta en tiempo real a **veterinarios** (que gestionan consultas, recetas, vacunas y fichas), **tutores o propietarios** (que consultan el historial clínico y carnet sanitario de sus mascotas) y **administradores** de las sucursales clínicas.

---

### 📸 Vista Previa e Interfaz de Usuario

> [!NOTE]
> *Aquí se incluirán las capturas de pantalla finales de la aplicación una vez desplegada.*

| **Panel de Control Principal (Dashboard)** | **Ficha Clínica y Historial Médico** |
| :---: | :---: |
| ![Dashboard Principal](https://placehold.co/600x400/0ea5e9/ffffff?text=Dashboard+VetVault) | ![Ficha Médica y Historial](https://placehold.co/600x400/22c55e/ffffff?text=Ficha+M%C3%A9dica+VetVault) |

| **Copiloto de IA (Escribano de Voz)** | **Carnet de Vacunación Digital** |
| :---: | :---: |
| ![Copiloto de IA](https://placehold.co/600x400/0ea5e9/ffffff?text=Copiloto+IA+Escribano) | ![Carnet Digital](https://placehold.co/600x400/22c55e/ffffff?text=Carnet+de+Vacunas) |

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
   - **Escribano por Voz**: Transcripción de audios grabados en consulta a fichas médicas estructuradas automáticamente mediante Gemini.
   - **Triaje Sintomático**: Clasificación inteligente de urgencias veterinarias basada en el reporte del dueño.

---

## 🛠️ Estructura del Monorrepitorio

El proyecto está organizado como un **monorrepitorio** que divide frontends y servicios backend:

```
proyecto-vet-pp/
├── apps/
│   ├── web-app/             # Aplicación React 19 (Vite) para veterinarios y administradores
│   └── mobile-app/          # Aplicación React Native para propietarios/tutores (En desarrollo)
├── services/
│   └── api-backend/         # Servidor Fastify (Node.js + TypeScript) y base de datos Postgres
├── SYSTEM_OVERVIEW.md       # Documento detallado de arquitectura y base de datos
└── README.md                # [Este Documento]
```

Para conocer en detalle la arquitectura del sistema, diagramas de relaciones y estructura de base de datos, consulte el archivo [SYSTEM_OVERVIEW.md](file:///home/rei/VetVault/proyecto-vet-pp/SYSTEM_OVERVIEW.md).

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

### Paso 2: Instalar y Correr Frontend Web
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
