# @vetvault/shared — Paquete de Tipos y Utilidades Compartidas 

Este paquete contiene las definiciones de tipos TypeScript unificadas, interfaces de comunicación API y funciones de utilidad que se comparten entre el frontend (`apps/web-app`) y el backend (`services/api-backend`).

Al estar resuelto mediante **npm workspaces**, las aplicaciones del monorrepositorio consumen directamente la compilación de este paquete.

---

## 📂 Estructura del Código

El código fuente dentro de `src/` se organiza de la siguiente manera:

```
packages/shared/
├── dist/                # Archivos compilados generados por TypeScript (JS + .d.ts)
├── src/
│   ├── index.ts         # Punto de entrada de las exportaciones del paquete
│   ├── types.ts         # Interfaces de datos y tipos de peticiones/respuestas
│   └── utils.ts         # Funciones auxiliares reutilizables de lógica de dominio
├── package.json         # Configuración del paquete y scripts de compilación
└── tsconfig.json        # Configuración de TypeScript
```

---

## 🔑 Tipos y Modelos Compartidos (`src/types.ts`)

Centraliza los contratos de datos para asegurar que los cambios de base de datos se propaguen de forma segura y consistente en todas las aplicaciones:

1. **Modelos Clínicos**:
   - `Mascota`: Datos reducidos de un paciente (nombre, nacimiento, sexo, castrado, raza, especie).
   - `MascotaDetail`: Ficha completa de mascota incluyendo alergias, condiciones crónicas, contraindicaciones y la relación activa con sus propietarios/tutores.
   - `CitaMapped`: Representación estructurada de un turno médico con datos del profesional, clínica y mascota.
2. **Modelos de Autenticación**:
   - `TokenPayload`: Estructura decodificada del JWT conteniendo los identificadores del usuario (`usuario_id`, `vetId`, `proId`), correo electrónico y rol.
3. **Estructuras de Entrada de Formularios (Inputs)**:
   - `RegistroVeterinarioInput`: Campos requeridos para registrar un profesional y crear su clínica inicial.
   - `RegistroVeterinarioUnirseInput`: Datos requeridos para unirse a una clínica mediante token de invitación.
   - `RegistroPropietarioInput`: Campos de registro para propietarios/tutores de mascotas.

---

## 🛠️ Funciones de Utilidad (`src/utils.ts`)

Módulos y funciones auxiliares para formateo y lógica de negocio visual:

*   **`formatDate(dateStr: string): string`**: Formatea fechas de cadenas de texto al estándar local de Argentina (`DD de mmm. de AAAA`).
*   **`calcAge(dateStr: string): string`**: Calcula de forma dinámica la edad del animal a partir de su nacimiento, retornando la salida formateada en lenguaje natural en español (ej: `5 meses` o `3 años y 2 meses`).
*   **`getEstadoBadgeVariant(estado: string): 'success' | 'warning' | 'danger' | 'neutral'`**: Mapea el estado de un turno a un esquema de color semántico compatible con los design tokens.
*   **`getUIEstado(cita: any): string`**: Infiere el estado de la cita en la interfaz, priorizando si ya cuenta con una atención médica registrada (`Completada`).
*   **`monthNames`**: Pool con abreviaciones de meses en español (`Ene`, `Feb`, ..., `Dic`).

---

## ⚙️ Compilación y Distribución

Para que los cambios realizados en este paquete tengan efecto en las aplicaciones consumidoras (como `web-app`), el código TypeScript debe compilarse a JavaScript plano en la carpeta `dist/`.

### Comandos Disponibles:
Ejecutar desde el directorio `packages/shared/`:

```bash
npm run build       # Compila el código TS y genera los tipos .d.ts en dist/
```

> [!IMPORTANT]
> **Orden de Construcción**: La aplicación web depende de `@vetvault/shared`. Si realizás modificaciones aquí o estás inicializando el monorrepositorio por primera vez, **debés compilar este paquete primero** antes de intentar compilar o levantar en modo desarrollo la aplicación web.
