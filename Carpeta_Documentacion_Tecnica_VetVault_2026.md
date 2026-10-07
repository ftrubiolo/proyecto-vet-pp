# VET VAULT
## Plataforma SaaS de Gestión Clínica Veterinario-Mascota con Inteligencia Artificial
### Carpeta de Documentación Técnica y Funcional — PIN 2026

---

## 2.1. Portada Institucional Completa

* **Institución:** Instituto Superior Villa del Rosario
* **Carrera:** Técnico Superior en Desarrollo Web y Software
* **Materia:** Práctica Profesionalizante I y II (Año 2026)
* **Docente Responsable:** Mgter. Lic. Enzo Varela
* **Integrantes del Equipo:**
  * Facundo Rubiolo ([@ftrubiolo](https://github.com/ftrubiolo))
  * Tomás Taborda ([@tabordatomas](https://github.com/tabordatomas))
  * Valentín Hinojosa ([@valexxarg777](https://github.com/valexxarg777))
  * Ismael Botella ([@ismaelbotella997](https://github.com/ismaelbotella997))
* **Lugar y Fecha:** Villa del Rosario, Córdoba — 2026

---

## 2.2. Índice Estructurado de Contenidos

1. [2.1. Portada Institucional Completa](#21-portada-institucional-completa)
2. [2.2. Índice Estructurado de Contenidos](#22-índice-estructurado-de-contenidos)
3. [2.3. Resumen Ejecutivo](#23-resumen-ejecutivo)
4. [2.4. Descripción del Problema y Oportunidad](#24-descripción-del-problema-y-oportunidad)
5. [2.5. Modelo de Negocio (Lienzo Canvas - 9 Bloques)](#25-modelo-de-negocio-lienzo-canvas---9-bloques)
6. [2.6. Requerimientos del Sistema (Funcionales y No Funcionales)](#26-requerimientos-del-sistema)
7. [2.7. Diagramas del Sistema (Sintaxis Mermaid y Arquitectura)](#27-diagramas-del-sistema)
   * [2.7.1. Diagrama de Casos de Uso](#271-diagrama-de-casos-de-uso)
   * [2.7.2. Diagrama de Clases y Dominio](#272-diagrama-de-clases-y-dominio)
   * [2.7.3. Diagramas de Secuencia (Copiloto IA y Flujo Clínico de Atención/Vacunación)](#273-diagramas-de-secuencia)
   * [2.7.4. Diagrama de Arquitectura de Alto Nivel](#274-diagrama-de-arquitectura-de-alto-nivel)
   * [2.7.5. Diagrama Entidad-Relación (DER)](#275-diagrama-entidad-relación-der)
8. [2.8. Diseño y Prototipado UX/UI (Design Tokens, Glassmorphism y Roles)](#28-diseño-y-prototipado-uxui)
9. [2.9. Arquitectura Técnica (Desglose Formal del Stack Tecnológico)](#29-arquitectura-técnica)
10. [2.10. Implementación de Inteligencia Artificial (Copiloto Clínico Gemini)](#210-implementación-de-inteligencia-artificial)
11. [2.11. Base de Datos (Diccionario de Datos y Script DDL SQL)](#211-base-de-datos)
12. [2.12. Manual Técnico (Guía de Instalación y Variables de Entorno)](#212-manual-técnico)
13. [2.13. Manual de Usuario (Flujos para Veterinario, Tutor y Administrador)](#213-manual-de-usuario)
14. [2.14. Pruebas del Sistema (Matriz de Casos de Prueba)](#214-pruebas-del-sistema-matriz-de-casos-de-prueba)
15. [2.15. Conclusiones y Trabajo Futuro](#215-conclusiones-y-trabajo-futuro)
16. [2.16. Anexos (Estructura de Repositorio y Normativas)](#216-anexos)

---

## 2.3. Resumen Ejecutivo

**Visión General:** **VetVault** es una solución SaaS integral de gestión clínica veterinaria y seguimiento de salud de mascotas orientada a resolver la dispersión de datos clínicos, la pérdida de trazabilidad médica de pacientes animales y la consecuente fuga de clientes recurrentes en clínicas y consultorios veterinarios.

El ecosistema está construido como un **monorrepitorio modular en TypeScript** con separación estricta de responsabilidades:
- **Frontend Web:** Aplicación SPA reactiva desarrollada en **React 19** con **Vite 8** y **React Router 7**, estilizada mediante un sistema de diseño propio basado en **CSS Custom Properties**, efectos de **Glassmorphism**, soporte completo para modo claro/oscuro y acentuación semántica según el rol del usuario.
- **Backend API:** Servicio REST de alto rendimiento construido en **Fastify 5** sobre **Node.js (v22+)** y **TypeScript**, implementando una arquitectura por capas desacoplada (Controladores, Servicios, Rutas, Middlewares).
- **Persistencia y Almacenamiento:** Base de datos relacional **PostgreSQL 16** modelada y administrada mediante **Drizzle ORM** (con Drizzle Kit para migraciones y schemas fuertemente tipados), complementada con almacenamiento de objetos compatible con **S3 (MinIO / AWS S3)** para fotografías de pacientes y perfiles profesionales.

A diferencia de soluciones genéricas o tradicionales en formato papel, VetVault integra:
1. **Validación de Matrículas en Tiempo Real:** Integración con el padrón oficial del **Colegio de Médicos Veterinarios de la Provincia de Córdoba**, garantizando que sólo profesionales habilitados (Categoría A) puedan realizar registros clínicos y prescripciones médicas.
2. **Vademécum Oficial y Protocolos de Vacunación (SENASA):** Catálogo estandarizado de fármacos veterinarios y esquemas vacunales oficiales con cálculo automatizado de fechas de refuerzo según intervalos certificados.
3. **Copiloto Clínico por Inteligencia Artificial (Google Gemini 3.1 Flash Lite):** Asistente conversacional con soporte de **Function Calling / Tool Calling** (14 herramientas operativas), recuperación contextualizada (RAG), control de cuotas por rol (`MAX_FUNCTION_CALLS`), rate limiting en memoria y registro de auditoría (`audit_log`).
4. **Monetización y Facturación SaaS:** Integración nativa con la pasarela **Mercado Pago** para planes de suscripción (`independent` y `clinic_pro`) con gestión de webhooks y bypass para entornos de desarrollo.
5. **Generación Server-Side de Documentos Oficiales:** Motor de renderizado PDF en el backend con **pdfmake** para emisión de carnés de vacunación, certificados de atención y recetas digitales.

**Público Objetivo:**
- **Clínicas Veterinarias y Sucursales (B2B):** Que requieren gestión multi-profesional, control de turnos, historiales médicos centralizados, facturación y catálogo oficial.
- **Veterinarios Independientes (B2B):** Profesionales autónomos que necesitan una herramienta ágil para registro clínico, consulta de vademécum y fidelización de pacientes.
- **Tutores / Propietarios de Mascotas (B2C):** Dueños de animales domésticos que demandan acceso permanente al carné de vacunación digital, recordatorios de dosis, historial clínico resumido y asistencia primaria mediante IA preventiva.

**Valor Diferencial:** La convergencia entre cumplimiento normativo real (validación de matrícula profesional y fármacos SENASA), experiencia de usuario moderna sin dependencias infladas, y un agente inteligente con permisos regulados que asiste en la consulta en lugar de ser un simple chatbot de texto aislado.

---

## 2.4. Descripción del Problema y Oportunidad

### Contexto del Problema
En el modelo operativo veterinario convencional, la información médica animal descansa mayoritariamente en libretas sanitarias impresas en papel y cuadernos clínicos manuscritos. Esta fragmentación física acarrea problemas sustanciales:
1. **Pérdida de continuidad clínica:** Los tutores suelen extraviar o dañar las cartillas, imposibilitando que otro veterinario consulte antecedentes de cirugías, alergias o reacciones adversas.
2. **Olvido sistemático de refuerzos:** Las vacunas y antiparasitarios requieren dosis repetidas con intervalos precisos; la ausencia de alertas sincronizadas expone a las mascotas a enfermedades inmunoprevenibles (parvovirus, moquillo, rabia).
3. **Falta de verificación profesional:** Inexistencia de mecanismos automáticos que corroboren si quien prescribe un fármaco controlado posee matrícula profesional activa y habilitante.
4. **Errores en prescripción:** Confusión de nombres comerciales, dosis y periodos de carencia por no cotejar catálogos farmacológicos oficiales.

### Análisis Actual e Impacto
Los pocos centros veterinarios que disponen de software utilizan herramientas heredadas (*legacy*), basadas en interfaces de escritorio monousuario, lentas y sin acceso para el tutor. Esto genera:
- Sobrecarga administrativa de hasta 3 horas diarias en tareas de coordinación de turnos y búsqueda de fichas.
- Pérdida de un 35% de pacientes en revacunaciones por falta de recordatorios proactivos.
- Tiempos de atención clínica prolongados debido a la necesidad de reconstruir manualmente el historial del paciente en cada consulta.

### Oportunidad de Mercado
VetVault capitaliza esta brecha entregando una plataforma SaaS web moderna, responsiva y colaborativa:
- **Reducción del 60% en el tiempo de preparación de la consulta**, gracias a la sintetización de antecedentes y consulta rápida con el Copiloto IA.
- **Trazabilidad 100% auditable de fármacos y vacunas**, con vinculación directa al catálogo de SENASA y lotes administrados.
- **Fidelización y retención de tutores**, mediante un carné sanitario digital accesible 24/7 en cualquier navegador o dispositivo móvil.

---

## 2.5. Modelo de Negocio (Lienzo Canvas - 9 Bloques)

| Bloque Canvas | Detalle Operativo y Estratégico de VetVault |
| :--- | :--- |
| **1. Segmentos de Clientes** | • **Clínicas Veterinarias (B2B):** Centros médicos con múltiples veterinarios y sucursales.<br>• **Veterinarios Independientes (B2B):** Médicos veterinarios autónomos o a domicilio.<br>• **Tutores de Mascotas (B2C):** Dueños que buscan seguimiento clínico digital y confiable. |
| **2. Propuestas de Valor** | • **Para Veterinarias:** Ficha clínica integral, control de stock según vademécum SENASA, validación de matrícula del Colegio de Córdoba, Copiloto IA con 14 herramientas y agenda de turnos.<br>• **Para Tutores:** Carnet sanitario digital oficial en PDF, historial accesible 24/7, asistente de orientación preventiva con IA y alertas de refuerzo. |
| **3. Canales** | • **Aplicación Web SPA:** Portal responsive en React 19.<br>• **Aplicación Móvil (React Native):** En desarrollo para tutores.<br>• **Canales B2B:** Alianzas institucionales, convenios con colegios veterinarios y marketing digital especializado. |
| **4. Relaciones con Clientes** | • **Autoservicio Digital:** Registro autónomo de tutores y gestión fluida de turnos.<br>• **Acompañamiento Profesional:** Onboarding asistido y soporte técnico para clínicas.<br>• **Transparencia y Seguridad:** Resguardo estricto de historiales médicos y auditoría de IA. |
| **5. Fuentes de Ingresos** | • **Suscripciones SaaS Recurrentes (Mercado Pago):**<br>&nbsp;&nbsp;- Plan `independent`: Para profesionales independientes.<br>&nbsp;&nbsp;- Plan `clinic_pro`: Para clínicas completas con múltiples profesionales y turnos.<br>• **Servicios de Valor Añadido:** Módulos avanzados de analítica clínica y reportes exportables. |
| **6. Recursos Clave** | • **Código Fuente Propietario:** Monorrepitorio TypeScript (React 19 + Fastify 5 + Drizzle ORM).<br>• **Infraestructura en Contenedores:** Docker Compose (PostgreSQL 16, MinIO S3 Object Storage, Node API).<br>• **Bases de Datos Oficiales:** Padrón del Colegio de Veterinarios de Córdoba y Vademécum SENASA.<br>• **API de Modelos Generativos:** Google Gemini API con soporte de Function Calling. |
| **7. Actividades Clave** | • Desarrollo continuo y evolución del monorrepitorio de software.<br>• Mantenimiento de esquemas de datos relacionales y optimización de consultas.<br>• Refinamiento de Prompt Engineering, seguridad anti-inyección y curación de herramientas de IA.<br>• Cumplimiento legal sanitario y actualización de padrones provinciales/nacionales. |
| **8. Socios Clave** | • **Colegio de Médicos Veterinarios de la Provincia de Córdoba:** Fuente del registro matriculado.<br>• **SENASA:** Registro oficial de productos farmacológicos y protocolos vacunales.<br>• **Mercado Pago:** Procesador de pagos de suscripciones y checkout seguro.<br>• **Google Cloud / Google AI:** Proveedor del motor Gemini 3.1 Flash Lite.<br>• **Instituto Superior Villa del Rosario:** Marco académico de validación y desarrollo. |
| **9. Estructura de Costos** | • Costos de servidores en la nube (cómputo backend y base de datos PostgreSQL).<br>• Almacenamiento de objetos S3 / MinIO para imágenes médicas.<br>• Consumo de tokens en la API de Google Gemini.<br>• Comisiones de pasarela de pago (Mercado Pago).<br>• Mantenimiento de dominios, certificados SSL y herramientas de monitoreo. |

---

## 2.6. Requerimientos del Sistema

### Requerimientos Funcionales (RF)

* **RF-01: Autenticación y Autorización Basada en Roles (RBAC):** Inicio de sesión seguro mediante tokens JWT almacenados en `HttpOnly Cookies` seguras, diferenciando permisos entre tres roles: `Administrador`, `Veterinario` y `Propietario`.
* **RF-02: Validación Oficial de Matrícula Profesional:** Durante el registro o vinculación de un veterinario a una clínica, el sistema debe consultar el padrón oficial del Colegio de Médicos Veterinarios de Córdoba, validando el número de matrícula y su categoría (Categoría A: habilitado; Categorías B y C: restringidas para atenciones clínicas).
* **RF-03: Gestión Integral de Pacientes (Mascotas):** Registro completo de animales domésticos incluyendo nombre, especie, raza, fecha de nacimiento, sexo, estado reproductivo (castrado), número de microchip, alergias, condiciones crónicas, contraindicaciones y fotografías de perfil.
* **RF-04: Asociación Tutor-Paciente:** Vinculación flexible entre tutores y mascotas mediante la tabla de relación `mascotas_propietarios`, permitiendo registrar cotutores o bajas lógicas con fecha de desasociación.
* **RF-05: Gestión de Clínicas, Horarios y Turnos (Citas):** Registro de sucursales veterinarias, configuración de disponibilidad horaria por día y programación de citas médicas categorizadas por motivo (Consulta General, Vacunación, Urgencia, Control) y estado (Pendiente, Confirmada, Completada, Cancelada).
* **RF-06: Registro de Atenciones Clínicas:** Conversión de una cita médica en una atención clínica (`atención`), registrando notas médicas, pesaje actual del paciente, diagnósticos estructurados y tratamientos simultáneos.
* **RF-07: Prescripción de Medicamentos con Vademécum SENASA:** Prescripción farmacológica con validación obligatoria contra el catálogo oficial de SENASA (`catalogo_productos`), registrando dosis, vía, frecuencia, fecha de inicio y finalización.
* **RF-08: Gestión de Vacunación y Cálculo de Refuerzos:** Creación de series vacunales (`vacuna_serie`) atadas a protocolos homologados de SENASA (`vacuna_protocolo`), registro de dosis aplicadas con lote y vía, y cálculo matemático automático de la fecha del próximo refuerzo.
* **RF-09: Copiloto Clínico IA Conversacional con Tool Calling:** Chatbot con inyección de contexto RAG que asiste a veterinarios y tutores, capaz de ejecutar 14 herramientas dinámicas de consulta y agendamiento directamente sobre la base de datos.
* **RF-10: Auditoría Estricta de Herramientas de IA:** Registro obligatorio e inmutable en la tabla `audit_log` de cada ejecución de herramientas por parte de la IA, persistiendo identificador de usuario, rol, nombre de la función, argumentos ejecutados y marca temporal.
* **RF-11: Monetización y Facturación SaaS con Mercado Pago:** Gestión automatizada de suscripciones a través de Checkout Pro de Mercado Pago para los planes `independent` y `clinic_pro`, con recepción de notificaciones vía Webhook y bypass habilitado para desarrollo local (`/api/suscripciones/dev-bypass`).
* **RF-12: Emisión y Descarga de Certificados Oficiales en PDF:** Motor de renderizado en backend (`pdfmake`) para emitir carnés sanitarios descargables, resúmenes de atención médica y recetas oficiales con validez clínica.
* **RF-13: Almacenamiento de Archivos Multimedia:** Carga de imágenes (fotos de mascotas, perfiles de veterinarios) procesadas y almacenadas en MinIO / AWS S3 vía endpoints multipart.

### Requerimientos No Funcionales (RNF)

* **RNF-01: Seguridad en Autenticación y Cookies:** Contraseñas hasheadas con algoritmo BCrypt (Work Factor 10/11). Almacenamiento de tokens JWT exclusivamente en cookies con directivas `HttpOnly`, `SameSite=Lax` y `Secure` en producción, neutralizando vectores de ataque XSS y robo de credenciales en almacenamiento local.
* **RNF-02: Rendimiento y Baja Latencia:** Servidor backend estructurado sobre Fastify 5, logrando tiempos de respuesta inferiores a **100 ms** en operaciones CRUD estándar y menos de **1.5 s** en flujos conversacionales con Tool Calling de IA.
* **RNF-03: Arquitectura Limpia y Tipado Estricto de Extremo a Extremo:** Utilización integral de TypeScript con tipos y contratos compartidos en `@vetvault/shared`, garantizando consistencia absoluta entre frontend y backend sin discrepancias de DTOs.
* **RNF-04: Resguardo y Límites de Inteligencia Artificial:**
  - *Rate Limiting:* Limitación en memoria a un máximo de **30 peticiones por minuto** por usuario en `/api/ai/chat`.
  - *Presupuesto de Tools (MAX_FUNCTION_CALLS):* Cuota estricta por turno: 8 llamadas para Veterinario, 4 para Propietario/Tutor y 8 para Administrador.
  - *Prompt Injection Guardrails:* Cláusulas de sistema que impiden revelar instrucciones internas, eludir reglas de negocio o prescribir fármacos sin supervisión médica.
* **RNF-05: Usabilidad e Identidad Visual (UX/UI):** Interfaz Web Mobile-First construida con Sistema de Tokens CSS, microinteracciones fluidas, soporte nativo de modo claro/oscuro y alternancia de acentos dinámicos por rol (`.role-vet` en azul `#0EA5E9` y `.role-owner` en verde `#22C55E`), alcanzando un puntaje superior a 85 en la escala SUS.
* **RNF-06: Portabilidad y Contenedorización:** Toda la plataforma (Fastify API, React Web App, PostgreSQL 16 y MinIO Object Storage) debe ser desplegable y reproducible de manera idéntica mediante `docker-compose.yml`.

---

## 2.7. Diagramas del Sistema

A continuación se presentan los diagramas que describen las interacciones, estructura de dominio, secuencias operativas y persistencia del sistema VetVault. Todos los diagramas se incluyen en sintaxis **Mermaid** para su edición directa y renderizado en GitHub, editores Markdown o visores compatibles.

### 2.7.1. Diagrama de Casos de Uso

Este diagrama ilustra las interacciones de los tres actores del sistema con los módulos de VetVault:

```mermaid
flowchart TD
    subgraph Actores [Actores del Sistema]
        V["Veterinario"]
        P["Propietario / Tutor"]
        A["Administrador"]
    end

    subgraph Modulos [Módulos Funcionales de VetVault]
        CU1["CU1: Autenticación JWT en HttpOnly Cookie"]
        CU2["CU2: Validación de Matrícula (Padrón Córdoba)"]
        CU3["CU3: Gestión de Citas y Horarios"]
        CU4["CU4: Registro de Atención Clínica y Diagnóstico"]
        CU5["CU5: Prescripción con Catálogo Oficial SENASA"]
        CU6["CU6: Protocolo de Vacunación y Cálculo de Refuerzos"]
        CU7["CU7: Consulta de Ficha Médica y Carné Digital"]
        CU8["CU8: Copiloto Clínico IA (Function Calling)"]
        CU9["CU9: Emisión y Descarga de Documentos PDF"]
        CU10["CU10: Suscripción SaaS con Mercado Pago"]
        CU11["CU11: Gestión de Clínicas, Sucursales y Roles"]
    end

    V --> CU1
    V --> CU2
    V --> CU3
    V --> CU4
    V --> CU5
    V --> CU6
    V --> CU7
    V --> CU8
    V --> CU9
    V --> CU10

    P --> CU1
    P --> CU3
    P --> CU7
    P --> CU8
    P --> CU9

    A --> CU1
    A --> CU10
    A --> CU11
    A --> CU8
```

---

### 2.7.2. Diagrama de Clases y Dominio

Representa las entidades del modelo de dominio implementadas en el backend con TypeScript y Drizzle ORM:

```mermaid
classDiagram
    class Usuario {
        +UUID id
        +string email
        +string password_hash
        +int rol_id
        +DateTime fecha_creacion
    }
    class Veterinario {
        +UUID id
        +UUID usuario_id
        +string nombre
        +string apellido
        +string numero_matricula
        +string telefono
        +string foto_url
    }
    class Propietario {
        +UUID id
        +UUID usuario_id
        +string nombre
        +string apellido
        +bool es_empresa
        +string telefono
        +string direccion
    }
    class Mascota {
        +UUID id
        +string nombre
        +DateTime fecha_nacimiento
        +int raza_id
        +char sexo
        +bool es_castrado
        +string numero_microchip
        +string alergias
    }
    class Clinica {
        +UUID id
        +string nombre_comercial
        +string direccion
        +string telefono
    }
    class Cita {
        +UUID id
        +UUID mascota_id
        +UUID veterinario_id
        +UUID clinica_id
        +DateTime fecha_hora
        +int motivo_id
        +int estado_cita_id
    }
    class Atencion {
        +UUID id
        +UUID cita_id
        +UUID mascota_id
        +UUID veterinario_id
        +UUID clinica_id
        +string notas_clinicas
        +decimal peso_actual
        +DateTime fecha_atencion
    }
    class Tratamiento {
        +UUID id
        +UUID atencion_id
        +int tipo_id
        +int producto_id
        +string dosis
        +string frecuencia
        +DateTime fecha_inicio
        +DateTime fecha_fin
    }
    class VacunaSerie {
        +UUID id
        +int protocolo_id
        +UUID mascota_id
        +UUID veterinario_id
        +DateTime fecha_inicio
        +string estado_serie
        +int dosis_aplicadas
        +DateTime proximo_refuerzo
    }
    class VacunaDosis {
        +UUID id
        +UUID serie_id
        +UUID atencion_id
        +int numero_dosis
        +DateTime fecha_aplicacion
        +string lote
        +string via_administracion
    }
    class Suscripcion {
        +UUID id
        +UUID usuario_id
        +string mp_preapproval_id
        +string estado
        +string plan
        +DateTime fecha_expiracion
    }
    class AuditLog {
        +UUID id
        +UUID user_id
        +string user_rol
        +string tool
        +jsonb args
        +DateTime timestamp
    }

    Usuario "1" -- "0..1" Veterinario : perfil_vet
    Usuario "1" -- "0..1" Propietario : perfil_tutor
    Usuario "1" -- "0..*" Suscripcion : tiene
    Propietario "1" -- "0..*" Mascota : tutela
    Clinica "1" -- "0..*" Cita : programa
    Veterinario "1" -- "0..*" Cita : asignado
    Mascota "1" -- "0..*" Cita : asiste
    Cita "1" -- "0..1" Atencion : genera
    Atencion "1" -- "0..*" Tratamiento : receta
    Atencion "1" -- "0..*" VacunaDosis : administra
    VacunaSerie "1" -- "1..*" VacunaDosis : compone
    Mascota "1" -- "0..*" VacunaSerie : recibe
```

---

### 2.7.3. Diagramas de Secuencia

#### Secuencia 1 — Flujo del Copiloto Clínico de IA con Function Calling

Describe cómo el Copiloto IA de VetVault procesa una consulta en lenguaje natural, ejecuta herramientas en la base de datos y audita las operaciones:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Veterinario / Tutor
    participant FE as Web App (React 19)
    participant BE as Backend (Fastify 5)
    participant Service as AiChatService
    participant Gemini as Google Gemini API
    participant DB as PostgreSQL (Drizzle)

    Usuario->>FE: Escribe consulta en AIChatDrawer
    FE->>BE: POST /api/ai/chat (Cookie HttpOnly: token, body: {message, history, context})
    BE->>BE: Verificar JWT y Rate Limiting (30 req/min)
    BE->>Service: processMessage(user, message, history, context)
    Service->>DB: Obtener contexto clínico (mascotas/turnos/clínicas)
    DB-->>Service: Retorna datos de contexto
    Service->>Gemini: Iniciar ChatSession (SystemPrompt + 14 Tool Declarations)
    Gemini-->>Service: Respuesta con FunctionCall (ej: get_vaccination_status)
    Service->>DB: AuditService.log(userId, rol, toolName, args)
    Service->>DB: Ejecutar handler de tool (consulta vía Drizzle)
    DB-->>Service: Datos del paciente / vacunas
    Service->>Gemini: Enviar FunctionResponse ({vacunas, refuerzos})
    Gemini-->>Service: Texto final estructurado en lenguaje natural
    Service-->>BE: Retorna texto sanitizado
    BE-->>FE: HTTP 200 OK {response}
    FE-->>Usuario: Muestra respuesta en chat interactivo
```

#### Secuencia 2 — Flujo de Atención Clínica, Prescripción y Vacunación Oficial

Describe la atención presencial de un paciente, la selección de productos validados de SENASA y la emisión del carné sanitario:

```mermaid
sequenceDiagram
    autonumber
    actor Vet as Veterinario Habilitado
    participant FE as Web App (React 19)
    participant BE as Backend (Fastify 5)
    participant DB as PostgreSQL (Drizzle ORM)
    participant PDF as PDF Engine (pdfmake)

    Vet->>FE: Inicia atención desde cita programada
    FE->>BE: GET /api/catalogo/productos y /api/vacunas/protocolos
    BE->>DB: SELECT productos (SENASA) y protocolos
    DB-->>BE: Catálogo validado
    BE-->>FE: Opciones de medicación y vacunas
    Vet->>FE: Carga notas, diagnóstico, receta y dosis vacunal
    FE->>BE: POST /api/atenciones (datos clínicos, tratamientos, vacuna)
    BE->>DB: Iniciar transacción: INSERT atencion, INSERT tratamientos
    BE->>DB: INSERT vacuna_dosis (lote, vía) y actualiza próximo refuerzo en vacuna_serie
    DB-->>BE: Transacción exitosa
    BE->>PDF: Generar resumen de atención y carnet sanitario actualizado
    PDF-->>BE: Buffer PDF generado
    BE-->>FE: HTTP 201 Created {atencionId, status: "OK"}
    FE-->>Vet: Notificación de éxito y visualización del carnet
```

---

### 2.7.4. Diagrama de Arquitectura de Alto Nivel

Este diagrama detalla la arquitectura desacoplada real del sistema, sus capas y las integraciones con servicios externos:

```mermaid
graph TD
    subgraph Presentacion [Capa de Presentación]
        A["Web App SPA (React 19 + Vite 8 + CSS Tokens)"]
        A2["Mobile App (React Native - En desarrollo)"]
    end

    subgraph BackendAPI [Capa de Backend y Servicios - Fastify 5]
        B["Fastify 5 REST API (Node.js 22 + TypeScript)"]
        B1["Auth Middleware (JWT en HttpOnly Cookies)"]
        B2["Rate Limiter & Audit Logger"]
        B3["Controladores & Servicios de Negocio"]
        B4["Módulo Copiloto IA (AiChatService)"]
        B5["Motor de Reportes PDF (pdfmake)"]
    end

    subgraph Persistencia [Capa de Persistencia y Storage]
        C[("PostgreSQL 16 (Drizzle ORM)")]
        D["MinIO / AWS S3 (Almacenamiento de Fotos y Archivos)"]
    end

    subgraph ServiciosExternos [Integraciones y Servicios Externos]
        E["Google Gemini API (gemini-3.1-flash-lite / Tools)"]
        F["Mercado Pago API (Checkout Pro & Webhooks)"]
        G["Padrón Colegio Veterinarios Córdoba (Validación Matrículas)"]
        H["Catálogo Oficial SENASA (Medicamentos y Vacunas)"]
    end

    A -->|HTTPS / Fetch con Cookies| B
    A2 -.->|HTTPS / REST| B
    B --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B3 --> B5
    B3 -->|Drizzle ORM| C
    B3 -->|AWS SDK S3| D
    B4 -->|SDK Generative AI| E
    B3 -->|Mercado Pago SDK| F
    B3 -.->|Verificación en BD Local| G
    B3 -.->|Sincronización / Catálogo| H
```

---

### 2.7.5. Diagrama Entidad-Relación (DER)

El siguiente diagrama refleja la estructura relacional real implementada en la base de datos PostgreSQL:

```mermaid
erDiagram
    USUARIOS ||--o{ VETERINARIOS : "es"
    USUARIOS ||--o{ PROPIETARIOS : "es"
    USUARIOS ||--o{ SUSCRIPCIONES : "posee"
    ROLES ||--o{ USUARIOS : "asigna"
    PROPIETARIOS ||--o{ MASCOTAS_PROPIETARIOS : "vincula"
    MASCOTAS ||--o{ MASCOTAS_PROPIETARIOS : "pertenece"
    TIPOS_RELACION ||--o{ MASCOTAS_PROPIETARIOS : "clasifica"
    ESPECIES ||--o{ RAZAS : "contiene"
    RAZAS ||--o{ MASCOTAS : "define"
    CLINICAS ||--o{ VETERINARIOS_CLINICAS : "asocia"
    VETERINARIOS ||--o{ VETERINARIOS_CLINICAS : "trabaja_en"
    CLINICAS ||--o{ HORARIOS_LABORALES : "establece"
    VETERINARIOS ||--o{ HORARIOS_LABORALES : "cumple"
    CLINICAS ||--o{ CITAS : "aloja"
    MASCOTAS ||--o{ CITAS : "agenda"
    VETERINARIOS ||--o{ CITAS : "atiende"
    CITAS ||--o| ATENCIONES : "origina"
    MASCOTAS ||--o{ ATENCIONES : "recibe"
    VETERINARIOS ||--o{ ATENCIONES : "registra"
    ATENCIONES ||--o{ ATENCIONES_DIAGNOSTICOS : "incluye"
    DIAGNOSTICOS_ATENCION ||--o{ ATENCIONES_DIAGNOSTICOS : "diagnostica"
    ATENCIONES ||--o{ TRATAMIENTOS : "prescribe"
    CATALOGO_PRODUCTOS ||--o{ TRATAMIENTOS : "suministra"
    TIPOS_TRATAMIENTO ||--o{ TRATAMIENTOS : "tipifica"
    CATEGORIAS_PRODUCTOS ||--o{ PRODUCTOS_CATEGORIAS : "clasifica"
    CATALOGO_PRODUCTOS ||--o{ PRODUCTOS_CATEGORIAS : "pertenece"
    VACUNA_PROTOCOLO ||--o{ VACUNA_SERIE : "rige"
    MASCOTAS ||--o{ VACUNA_SERIE : "inicia"
    VETERINARIOS ||--o{ VACUNA_SERIE : "supervisa"
    VACUNA_SERIE ||--o{ VACUNA_DOSIS : "contiene"
    ATENCIONES ||--o{ VACUNA_DOSIS : "aplica"
    CATEGORIAS_MATRICULAS ||--o{ VETERINARIOS_MATRICULADOS_CORDOBA : "habilita"
    USUARIOS ||--o{ AUDIT_LOG : "audita"

    USUARIOS {
        uuid id PK
        string email UK
        string password_hash
        int rol_id FK
        timestamp fecha_creacion
    }
    VETERINARIOS {
        uuid id PK
        uuid usuario_id FK
        string nombre
        string apellido
        string numero_matricula UK
        string telefono
        string foto_url
    }
    PROPIETARIOS {
        uuid id PK
        uuid usuario_id FK
        string nombre
        string apellido
        boolean es_empresa
        string telefono
        string direccion
    }
    MASCOTAS {
        uuid id PK
        string nombre
        timestamp fecha_nacimiento
        int raza_id FK
        char sexo
        boolean es_castrado
        string numero_microchip
        text alergias
    }
    CITAS {
        uuid id PK
        uuid mascota_id FK
        uuid veterinario_id FK
        uuid clinica_id FK
        timestamp fecha_hora
        int motivo_id FK
        int estado_cita_id FK
    }
    ATENCIONES {
        uuid id PK
        uuid cita_id FK
        uuid mascota_id FK
        uuid veterinario_id FK
        uuid clinica_id FK
        text notas_clinicas
        decimal peso_actual
        timestamp fecha_atencion
    }
    TRATAMIENTOS {
        uuid id PK
        uuid atencion_id FK
        int tipo_id FK
        int producto_id FK
        string dosis
        string frecuencia
        timestamp fecha_inicio
        timestamp fecha_fin
    }
    VACUNA_SERIE {
        uuid id PK
        int protocolo_id FK
        uuid mascota_id FK
        uuid veterinario_id FK
        timestamp fecha_inicio
        string estado_serie
        int dosis_aplicadas
        timestamp proximo_refuerzo
    }
    VACUNA_DOSIS {
        uuid id PK
        uuid serie_id FK
        uuid atencion_id FK
        int numero_dosis
        timestamp fecha_aplicacion
        string lote
        string via_administracion
    }
```

---

## 2.8. Diseño y Prototipado UX/UI

El diseño de VetVault sigue una filosofía moderna, limpia y altamente legible, diseñada para entornos clínicos donde la velocidad de lectura y la precisión son prioritarias.

### Flujo de Navegación Diferenciado
El sistema adapta su interfaz según el rol autenticado:
1. **Perfil Veterinario:** Enfocado en la productividad clínica. Presenta accesos directos a la **Agenda de Turnos del Día**, **Ficha del Paciente Activo**, **Historial Clínico por pestañas**, **Módulo de Nueva Atención con Prescripción** y el cajón retráctil del **Copiloto Clínico IA (`AIChatDrawer`)**.
2. **Perfil Propietario / Tutor:** Diseñado bajo paradigma Mobile-First. Prioriza la visualización del **Carné Digital de Vacunación**, la consulta de turnos programados, la ficha descriptiva de sus mascotas y el acceso al chat de orientación preventiva con IA.
3. **Perfil Administrador:** Gestión de clínicas, sucursales, alta y verificación de profesionales y supervisión de suscripciones activas.

### Sistema de Tokens y Temas CSS
En lugar de depender de frameworks CSS invasivos, VetVault implementa un **Sistema de Tokens Semánticos Nativo** en `src/index.css`:
* **Tipografías:** `Manrope` (Sans-Serif) para encabezados y números de alto impacto, e `Inter` para cuerpos de texto, tablas y datos clínicos.
* **Efectos Glassmorphism:**
  - Tarjetas principales (`.card`): fondo con degradado sutil (`var(--surface)`), borde fino (`1px solid var(--border)`) y desenfoque de fondo (`backdrop-filter: blur(12px)`).
  - Elementos anidados (`.card-inner`): elevación visual ligera con `backdrop-filter: blur(8px)`.
* **Modo Oscuro Dinámico:** Activado automáticamente mediante el atributo `[data-theme="dark"]`, redefiniendo variables de superficie (`#0f1119` a `#12151d`) y contrastes tipográficos sin necesidad de recompilar estilos.
* **Modo Compacto:** Activado mediante `[data-compact="true"]` para optimizar la densidad de información en pantallas de consultorio médico reduciendo paddings y márgenes.
* **Acentos Semánticos por Rol:**
  - `.role-vet`: Acento primario azul (`#0EA5E9` / `--accent-blue`) que transmite serenidad y precisión clínica.
  - `.role-owner`: Acento primario verde esmeralda (`#22C55E` / `--accent-green`) que aporta cercanía y calidez a los tutores.

### Componente de Chat Inteligente (AIChatDrawer)
El componente `AIChatDrawer.tsx` proporciona una interfaz conversacional fluida:
* **Sugerencias Aleatorias:** Muestra 3 tarjetas de consulta rápida extraídas de un pool de 10 sugerencias adaptadas al rol (los veterinarios reciben consultas sobre vademécum, dosis o diagnósticos; los tutores reciben consultas sobre calendarios de vacunas o cuidados primarios).
* **Feedback de Herramientas:** Cuando la IA invoca una función interna, la interfaz notifica al usuario qué acción clínica se está resolviendo de manera transparente.

---

## 2.9. Arquitectura Técnica

VetVault implementa una **arquitectura en monorrepitorio** con separación clara de responsabilidades:

```
proyecto-vet-pp/
├── apps/
│   ├── web-app/             # Single Page Application (React 19 + Vite 8)
│   └── mobile-app/          # Cliente Móvil para Tutores (React Native - En desarrollo)
├── packages/
│   └── shared/              # Contratos de datos, tipos TypeScript y utilidades comunes
└── services/
    └── api-backend/         # Servidor REST Fastify 5 + Drizzle ORM + Gemini AI
```

### Desglose Formal del Stack Tecnológico

| Capa | Tecnología | Justificación y Rol en el Proyecto |
| :--- | :--- | :--- |
| **Frontend Web** | **React 19 + Vite 8** | Rendimiento óptimo de renderizado, empaquetado instantáneo con Vite y navegación por rutas con React Router 7. |
| **Diseño / Estilos** | **CSS Custom Properties & Glassmorphism** | Sistema de diseño de alto rendimiento sin sobrecarga de dependencias, temas claro/oscuro y roles dinámicos. |
| **Iconografía** | **Lucide React** | Conjunto completo y consistente de iconos vectoriales ligeros para interfaces médicas. |
| **Comunicación HTTP** | **Native Fetch Wrapper (`apiFetch`)** | Cliente HTTP nativo con soporte integrado para `credentials: 'include'` (cookies seguras HttpOnly) y subidas multipart. |
| **Backend REST API** | **Fastify 5 + TypeScript** | Framework Node.js de latencia ultra baja, arquitectura modular con TypeScript y tipado estricto. |
| **Persistencia / ORM** | **Drizzle ORM + postgres.js** | Acceso a base de datos de tipado seguro a nivel de compilación, sin sobrecarga en tiempo de ejecución y migraciones reproducibles. |
| **Motor de Base de Datos** | **PostgreSQL 16** | Soporte robusto de transacciones ACID, tipos UUID nativos, arreglos y campos JSONB para esquemas de dosificación. |
| **Almacenamiento Multimedia** | **MinIO / AWS S3 (`@aws-sdk/client-s3`)** | Object Storage compatible con S3 para almacenamiento desacoplado de imágenes y firmas digitales. |
| **Motor de Reportes PDF** | **pdfmake** | Generación server-side de carnés sanitarios y recetas en PDF de alta fidelidad. |
| **Inteligencia Artificial** | **Google Gemini 3.1 Flash Lite (`@google/generative-ai`)** | Agente de IA multimodal de alta velocidad con soporte nativo de Function Calling / Tool Calling para interactuar con la BD. |
| **Pasarela de Pagos** | **Mercado Pago SDK (`mercadopago`)** | Checkout Pro para cobro recurrente de planes SaaS y procesamiento de notificaciones asíncronas vía webhooks. |
| **Contenedorización** | **Docker & Docker Compose** | Entorno estándar que orquesta la base de datos PostgreSQL, servidor MinIO, API backend y frontend web. |

---

## 2.10. Implementación de Inteligencia Artificial

VetVault cuenta con un **Copiloto Clínico Inteligente** basado en el modelo **Google Gemini 3.1 Flash Lite**, diseñado no sólo para responder consultas de texto, sino para actuar como un verdadero agente funcional capaz de consultar y operar sobre el sistema.

### Arquitectura de Function Calling (Llamada a Herramientas)
El módulo conversacional se articula a través del servicio `AiChatService` (`services/api-backend/src/services/ai/`). Cuando el usuario envía un mensaje, el agente evalúa su intención y decide si debe emitir una respuesta en lenguaje natural o invocar una de las **14 herramientas clínicas disponibles**:

| Herramienta (Tool) | Parámetros Principales | Propósito Clínico y Operativo |
| :--- | :--- | :--- |
| `schedule_appointment` | `mascotaId`, `clinicaId`, `fechaHora`, `motivoId` | Agenda una nueva cita médica validando permisos de acceso. |
| `get_my_appointments` | `clinicaId`, `dias` | Consulta las citas programadas para el veterinario o tutor en un rango de días. |
| `reschedule_appointment` | `citaId`, `nuevaFechaHora` | Reprograma un turno existente a una nueva fecha y hora. |
| `cancel_appointment` | `citaId`, `motivoCancelacion` | Cancela un turno programado actualizando su estado a cancelado. |
| `check_availability` | `fecha`, `clinicaId` | Verifica los bloques horarios disponibles para atención médica. |
| `get_vaccination_status` | `mascotaId` | Obtiene el estado vacunal completo del paciente, dosis aplicadas y refuerzos pendientes. |
| `find_patients_with_overdue_vaccines` | `clinicaId`, `diasVencidas` | Localiza pacientes con refuerzos de vacunación vencidos para campañas de fidelización. |
| `get_medical_history` | `mascotaId`, `limite` | Recupera el historial clínico cronológico completo de atenciones y consultas. |
| `get_visit_summary` | `mascotaId` | Genera un resumen compacto de las últimas atenciones y diagnósticos registrados. |
| `get_active_treatments` | `mascotaId` | Lista los tratamientos farmacológicos actualmente en curso para un paciente. |
| `search_patients_on_medication` | `medicamento`, `clinicaId` | Localiza qué pacientes están tomando un determinado fármaco en las clínicas del veterinario. |
| `search_vademecum` | `query`, `categoriaId` | Consulta el catálogo oficial de SENASA buscando principios activos o marcas comerciales. |
| `search_patient` | `query` | Busca mascotas por nombre o microchip (restringido a las clínicas del vet o mascotas del tutor). |
| `get_owner_contact` | `mascotaId` | Obtiene el contacto (teléfono, correo, dirección) del tutor responsable de un paciente. |

### Inyección de Contexto Dinámico (RAG)
Para enriquecer la respuesta sin requerir llamadas innecesarias a la base de datos, el sistema inyecta contexto previo según el rol:
- **Veterinario:** Se inyectan las próximas 5 citas de los próximos 7 días y el listado de clínicas donde ejerce (`buildGeneralContext`).
- **Propietario / Tutor:** Se inyecta la lista de sus mascotas registradas con sus edades y especies.
- **Ficha Activa:** Si el chat se abre desde la ficha de una mascota específica, se inyectan sus datos basales, alergias, peso y diagnósticos recientes (`buildClinicalContext`).

### Medidas de Seguridad, Guardrails y Auditoría
1. **Límites de Ejecución (`MAX_FUNCTION_CALLS`):** Para prevenir bucles infinitos de consultas y optimizar el consumo de tokens, el bucle de ejecución limita las llamadas por turno:
   - **Veterinarios:** Hasta 8 llamadas por consulta.
   - **Tutores / Propietarios:** Hasta 4 llamadas por consulta.
   - **Administradores:** Hasta 8 llamadas por consulta.
2. **Control de Frecuencia (Rate Limiter):** Middleware en memoria que limita las peticiones a un máximo de **30 req/min por usuario** en `/api/ai/chat`.
3. **Instrucciones Anti-Inyección de Prompt:** El `systemInstruction` contiene directivas estrictas que prohíben revelar instrucciones del sistema, anular las políticas de seguridad o emitir prescripciones automáticas no autorizadas.
4. **Inferencia Automática de Fechas:** El prompt instruye al agente a traducir automáticamente expresiones temporales relativas ("mañana", "hoy", "próximo lunes") a fechas absolutas en formato ISO 8601 considerando el huso horario local.
5. **Registro Inmutable de Auditoría (`audit_log`):** Cada vez que la IA ejecuta una herramienta, se persiste un registro con el ID del usuario, su rol, el nombre de la tool y los parámetros exactos utilizados.

---

## 2.11. Base de Datos

### Diccionario de Datos

| Tabla | Clave Primaria | Claves Foráneas | Descripción y Campos Principales |
| :--- | :--- | :--- | :--- |
| `roles` | `id` (SERIAL) | - | Catálogo de roles de seguridad (`Admin`, `Veterinario`, `Propietario`). |
| `usuarios` | `id` (UUID) | `rol_id` -> `roles.id` | Credenciales de acceso, correo único y contraseña en hash BCrypt. |
| `clinicas` | `id` (UUID) | - | Sucursales o centros veterinarios con razón comercial y contacto. |
| `veterinarios` | `id` (UUID) | `usuario_id` -> `usuarios.id` | Perfil profesional, número de matrícula y teléfono. |
| `veterinarios_clinicas` | - | `veterinario_id`, `clinica_id` | Tabla de unión N:M entre profesionales y clínicas habilitadas. |
| `propietarios` | `id` (UUID) | `usuario_id` -> `usuarios.id` | Tutores o empresas con datos de contacto y domicilio. |
| `especies` | `id` (SERIAL) | - | Especies animales soportadas (`Canino`, `Felino`, etc.). |
| `razas` | `id` (SERIAL) | `especie_id` -> `especies.id` | Razas clasificadas por especie. |
| `mascotas` | `id` (UUID) | `raza_id` -> `razas.id` | Ficha animal: nombre, fecha nacimiento, microchip, alergias y condiciones. |
| `mascotas_propietarios` | - | `mascota_id`, `propietario_id`, `tipo_relacion_id` | Vinculación N:M de cotutoría o tutoría única con control de vigencia. |
| `tipos_relacion` | `id` (SERIAL) | - | Tipo de vínculo (`Titular`, `Cotutor`, `Cuidador`). |
| `clinicas_mascotas` | - | `clinica_id`, `mascota_id`, `estado_paciente_id` | Admisión y vinculación de un paciente a una clínica. |
| `citas` | `id` (UUID) | `mascota_id`, `veterinario_id`, `clinica_id`, `motivo_id`, `estado_cita_id` | Turnos médicos con fecha, hora, motivo y estado de confirmación. |
| `atenciones` | `id` (UUID) | `cita_id`, `mascota_id`, `veterinario_id`, `clinica_id` | Consultas médicas realizadas: notas clínicas, peso actual y fecha. |
| `diagnosticos_atencion` | `id` (SERIAL) | - | Catálogo estandarizado de diagnósticos médicos veterinarios. |
| `atenciones_diagnosticos`| - | `atencion_id`, `diagnostico_id` | Asociación N:M entre una atención clínica y sus diagnósticos. |
| `catalogo_productos` | `id` (SERIAL) | - | Catálogo oficial de medicamentos y vacunas con certificado SENASA. |
| `categorias_productos` | `id` (SERIAL) | - | Familias terapéuticas de productos veterinarios SENASA. |
| `productos_categorias` | - | `producto_id`, `categoria_id` | Relación N:M entre productos y sus categorías farmacológicas. |
| `tratamientos` | `id` (UUID) | `atencion_id`, `tipo_id`, `producto_id` | Recetas y prescripciones: dosis, frecuencia, fecha inicio y fin. |
| `veterinarios_matriculados_cordoba` | `id` (SERIAL) | `categoria_id` -> `categorias_matriculas.id` | Padrón oficial importado para validación de matrículas activas en Córdoba. |
| `vacuna_protocolo` | `senasa_id` (INT)| - | Protocolo oficial de vacunas: dosis primaria, intervalo días y refuerzos. |
| `vacuna_serie` | `id` (UUID) | `protocolo_id`, `mascota_id`, `veterinario_id` | Serie de vacunación iniciada para una mascota con cálculo de próximo refuerzo. |
| `vacuna_dosis` | `id` (UUID) | `serie_id`, `atencion_id` | Dosis particular aplicada: lote, vía de administración y fecha. |
| `horarios_laborales` | `id` (UUID) | `veterinario_id`, `clinica_id` | Franjas horarias de atención por día de la semana y profesional. |
| `suscripciones` | `id` (UUID) | `usuario_id` -> `usuarios.id` | Estado de suscripción SaaS (`independent`, `clinic_pro`) vía Mercado Pago. |
| `audit_log` | `id` (UUID) | - | Registro de auditoría de cada función ejecutada por el agente de IA. |

---

### Script DDL SQL Oficial (PostgreSQL 16)

El siguiente script DDL representa fielmente el esquema generado por Drizzle ORM en la base de datos de producción:

```sql
-- ====================================================================
-- SISTEMA VETVAULT: SCRIPT DDL OFICIAL (POSTGRESQL 16 / DRIZZLE ORM)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SEGURIDAD Y ROLES
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. CLINICAS Y PROFESIONALES
CREATE TABLE IF NOT EXISTS clinicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_comercial VARCHAR(150) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS veterinarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    foto_url VARCHAR(500),
    numero_matricula VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS veterinarios_clinicas (
    veterinario_id UUID NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    estado_activo BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (veterinario_id, clinica_id)
);

CREATE TABLE IF NOT EXISTS horarios_laborales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    veterinario_id UUID NOT NULL REFERENCES veterinarios(id) ON DELETE CASCADE,
    clinica_id UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL, -- 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    hora_inicio VARCHAR(5) NOT NULL, -- Formato "HH:MM"
    hora_fin VARCHAR(5) NOT NULL
);

-- 3. VALIDACIÓN COLEGIO DE VETERINARIOS DE CÓRDOBA
CREATE TABLE IF NOT EXISTS categorias_matriculas (
    id VARCHAR(2) PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    cobertura TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS veterinarios_matriculados_cordoba (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(200) NOT NULL,
    numero_matricula VARCHAR(50) NOT NULL UNIQUE,
    dni VARCHAR(20) NOT NULL UNIQUE,
    categoria_id VARCHAR(2) NOT NULL REFERENCES categorias_matriculas(id),
    es_valido BOOLEAN NOT NULL DEFAULT TRUE,
    actualizado_el TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. PROPIETARIOS, MASCOTAS Y ESPECIES
CREATE TABLE IF NOT EXISTS propietarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    es_empresa BOOLEAN NOT NULL DEFAULT FALSE,
    razon_social VARCHAR(150),
    foto_url VARCHAR(500),
    telefono VARCHAR(50) NOT NULL,
    direccion VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS especies (
    id SERIAL PRIMARY KEY,
    especie VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS razas (
    id SERIAL PRIMARY KEY,
    especie_id INTEGER NOT NULL REFERENCES especies(id) ON DELETE CASCADE,
    raza VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS mascotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    foto_url VARCHAR(500),
    fecha_nacimiento TIMESTAMP NOT NULL,
    raza_id INTEGER NOT NULL REFERENCES razas(id),
    sexo CHAR(1) NOT NULL, -- 'M' o 'H'
    es_castrado BOOLEAN NOT NULL DEFAULT FALSE,
    numero_microchip VARCHAR(50),
    alergias TEXT,
    condiciones_cronicas TEXT,
    contraindicaciones TEXT
);

CREATE TABLE IF NOT EXISTS tipos_relacion (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS mascotas_propietarios (
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    propietario_id UUID NOT NULL REFERENCES propietarios(id) ON DELETE CASCADE,
    tipo_relacion_id INTEGER REFERENCES tipos_relacion(id),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_asociacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_desasociacion TIMESTAMP,
    PRIMARY KEY (mascota_id, propietario_id)
);

CREATE TABLE IF NOT EXISTS estados_paciente (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS clinicas_mascotas (
    clinica_id UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    estado_paciente_id INTEGER REFERENCES estados_paciente(id),
    fecha_admision TIMESTAMP NOT NULL,
    fecha_egreso TIMESTAMP,
    PRIMARY KEY (clinica_id, mascota_id)
);

-- 5. AGENDA DE CITAS Y ATENCIONES CLÍNICAS
CREATE TABLE IF NOT EXISTS motivos_cita (
    id SERIAL PRIMARY KEY,
    motivo VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS estados_cita (
    id SERIAL PRIMARY KEY,
    estado VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS citas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    veterinario_id UUID REFERENCES veterinarios(id),
    clinica_id UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP NOT NULL,
    motivo_id INTEGER NOT NULL REFERENCES motivos_cita(id),
    estado_cita_id INTEGER NOT NULL REFERENCES estados_cita(id)
);

CREATE TABLE IF NOT EXISTS atenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id UUID UNIQUE REFERENCES citas(id),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    veterinario_id UUID NOT NULL REFERENCES veterinarios(id),
    clinica_id UUID NOT NULL REFERENCES clinicas(id),
    notas_clinicas TEXT,
    peso_actual NUMERIC(5,2),
    fecha_atencion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnosticos_atencion (
    id SERIAL PRIMARY KEY,
    diagnostico VARCHAR(150) NOT NULL UNIQUE,
    categoria VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS atenciones_diagnosticos (
    atencion_id UUID NOT NULL REFERENCES atenciones(id) ON DELETE CASCADE,
    diagnostico_id INTEGER NOT NULL REFERENCES diagnosticos_atencion(id),
    PRIMARY KEY (atencion_id, diagnostico_id)
);

-- 6. CATÁLOGO SENASA Y TRATAMIENTOS
CREATE TABLE IF NOT EXISTS catalogo_productos (
    id SERIAL PRIMARY KEY,
    numero_senasa VARCHAR(50) NOT NULL UNIQUE,
    nombre_comercial VARCHAR(200) NOT NULL,
    nombre_firma VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias_productos (
    id SERIAL PRIMARY KEY,
    id_senasa INTEGER NOT NULL UNIQUE,
    categoria VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS productos_categorias (
    producto_id INTEGER NOT NULL REFERENCES catalogo_productos(id) ON DELETE CASCADE,
    categoria_id INTEGER NOT NULL REFERENCES categorias_productos(id_senasa) ON DELETE CASCADE,
    PRIMARY KEY (producto_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS tipos_tratamiento (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS tratamientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atencion_id UUID NOT NULL REFERENCES atenciones(id) ON DELETE CASCADE,
    tipo_id INTEGER NOT NULL REFERENCES tipos_tratamiento(id),
    producto_id INTEGER NOT NULL REFERENCES catalogo_productos(id),
    dosis VARCHAR(100) NOT NULL,
    frecuencia VARCHAR(100) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    indicaciones_adicionales TEXT
);

-- 7. VACUNACIÓN Y PROTOCOLOS SENASA
CREATE TABLE IF NOT EXISTS vacuna_protocolo (
    senasa_id INTEGER PRIMARY KEY,
    numero_inscripcion VARCHAR(100),
    nombre_comercial VARCHAR(200),
    observaciones TEXT,
    indicaciones_y_vias TEXT,
    especies_target VARCHAR(100)[],
    dosificacion_por_esp JSONB,
    vias_administracion VARCHAR(100)[],
    fecha_validez TIMESTAMP NOT NULL,
    total_dosis_serie_primaria INTEGER NOT NULL,
    intervalo_dias INTEGER[],
    tiene_refuerzo BOOLEAN NOT NULL DEFAULT FALSE,
    refuerzo_cada_dias INTEGER
);

CREATE TABLE IF NOT EXISTS vacuna_serie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocolo_id INTEGER NOT NULL REFERENCES vacuna_protocolo(senasa_id),
    mascota_id UUID NOT NULL REFERENCES mascotas(id) ON DELETE CASCADE,
    veterinario_id UUID NOT NULL REFERENCES veterinarios(id),
    fecha_inicio TIMESTAMP NOT NULL,
    estado_serie VARCHAR(20) NOT NULL DEFAULT 'en_curso',
    dosis_aplicadas INTEGER NOT NULL DEFAULT 0,
    proximo_refuerzo TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vacuna_dosis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serie_id UUID NOT NULL REFERENCES vacuna_serie(id) ON DELETE CASCADE,
    atencion_id UUID REFERENCES atenciones(id),
    numero_dosis INTEGER NOT NULL,
    fecha_aplicacion TIMESTAMP NOT NULL,
    lote VARCHAR(100) NOT NULL,
    via_administracion VARCHAR(100) NOT NULL,
    observaciones TEXT
);

-- 8. SUSCRIPCIONES (MERCADO PAGO) Y AUDITORÍA DE IA
CREATE TABLE IF NOT EXISTS suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mp_preapproval_id VARCHAR(150) UNIQUE,
    mp_payer_id VARCHAR(150),
    estado VARCHAR(20) NOT NULL DEFAULT 'inactivo',
    plan VARCHAR(20),
    fecha_expiracion TIMESTAMP,
    grace_period_start TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_rol VARCHAR(20) NOT NULL,
    tool VARCHAR(100) NOT NULL,
    args JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_mascotas_raza ON mascotas(raza_id);
CREATE INDEX IF NOT EXISTS idx_mascotas_propietarios_propietario ON mascotas_propietarios(propietario_id);
CREATE INDEX IF NOT EXISTS idx_citas_mascota ON citas(mascota_id);
CREATE INDEX IF NOT EXISTS idx_citas_veterinario ON citas(veterinario_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_atenciones_mascota ON atenciones(mascota_id);
CREATE INDEX IF NOT EXISTS idx_atenciones_fecha ON atenciones(fecha_atencion);
CREATE INDEX IF NOT EXISTS idx_tratamientos_atencion ON tratamientos(atencion_id);
CREATE INDEX IF NOT EXISTS idx_vacuna_serie_mascota ON vacuna_serie(mascota_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
```

---

## 2.12. Manual Técnico

### Requisitos Previos del Sistema
* **Node.js:** Versión 22 LTS o superior.
* **NPM:** Versión 10 o superior (gestor de monorrepitorio con workspaces).
* **Motor de Base de Datos:** PostgreSQL 16 (local o mediante contenedor Docker).
* **Almacenamiento S3:** MinIO local o bucket compatible en AWS S3.
* **Credenciales de APIs Externas:**
  - `GEMINI_API_KEY`: Clave de acceso a la API de Google Generative AI.
  - `MERCADOPAGO_ACCESS_TOKEN`: Token de autenticación de Mercado Pago (credenciales de prueba para Sandbox o producción).

### Variables de Entorno

#### Backend (`services/api-backend/.env`)
```ini
# Servidor y Puerto
PORT=5000
NODE_ENV=dev

# Persistencia PostgreSQL
DATABASE_URL="postgres://postgres:postgres@localhost:5432/postgres"

# Seguridad y Autenticación JWT
JWT_SECRET="vetvault_super_secret_jwt_key_2026"

# Inteligencia Artificial (Google Gemini)
GEMINI_API_KEY="AIzaSy...TuClaveDeGemini..."

# Facturación y Suscripciones (Mercado Pago)
MERCADOPAGO_ACCESS_TOKEN="TEST-0000000000000000-000000-xxxxxxxxxxxxxxxxx-000000000"

# Almacenamiento de Archivos (MinIO / S3)
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY="vetvault"
MINIO_SECRET_KEY="vetvault-secret"
MINIO_BUCKET="vetvault-fotos"
MINIO_PUBLIC_URL="http://localhost:9000/vetvault-fotos"
```

#### Frontend (`apps/web-app/.env`)
```ini
VITE_API_URL="http://localhost:5000/api"
```

### Procedimiento de Instalación y Arranque Rápido

#### Opción A: Despliegue Automatizado con Docker Compose
Para iniciar todo el ecosistema con un solo comando (PostgreSQL, MinIO, Backend y Frontend):
```bash
docker compose up --build
```
El servidor backend quedará disponible en `http://localhost:5000` y el cliente web en `http://localhost:5173`.

#### Opción B: Ejecución Local en Entorno de Desarrollo

1. **Instalación de Dependencias del Monorrepitorio:**
   Desde la raíz del proyecto:
   ```bash
   npm install
   ```

2. **Compilación del Paquete Compartido (`@vetvault/shared`):**
   ```bash
   cd packages/shared
   npm install
   npm run build
   ```

3. **Configuración y Poblado de la Base de Datos:**
   Dirigirse a `services/api-backend` y ejecutar el script automatizado de setup:
   ```bash
   cd ../../services/api-backend
   npm install
   npm run db:setup
   ```
   *Nota:* Este comando resetea las tablas, aplica las migraciones con Drizzle (`db:push`), inicializa el bucket S3 en MinIO y carga los catálogos oficiales del Colegio de Veterinarios de Córdoba y SENASA.
   *(Opcional)* Para cargar registros de prueba clínicos:
   ```bash
   npm run db:seed-mock
   ```

4. **Arranque del Backend API:**
   ```bash
   npm run dev
   # El servidor iniciará con tsx watch en http://localhost:5000
   ```

5. **Arranque del Frontend Web:**
   En una nueva terminal:
   ```bash
   cd apps/web-app
   npm install
   npm run dev
   # La interfaz Vite estará activa en http://localhost:5173
   ```

---

## 2.13. Manual de Usuario

### Guía para el Veterinario

1. **Inicio de Sesión y Verificación de Matrícula:**
   - Ingrese su correo y contraseña. Si se registra por primera vez, ingrese su matrícula profesional. El sistema validará automáticamente su habilitación en el padrón del Colegio de Veterinarios de Córdoba (Categoría A).
2. **Panel de Control (Dashboard):**
   - Visualice el resumen de turnos asignados para el día, alertas de refuerzos próximos y accesos directos a pacientes internados o ambulatorios.
3. **Atención Médica y Registro Clínico:**
   - Desde la **Agenda de Citas**, haga clic en **"Atender"** sobre un turno confirmado.
   - Cargue las notas de evolución médica, registre el pesaje actual del paciente y seleccione diagnósticos del catálogo estandarizado.
   - En la sección **Tratamientos**, busque fármacos directamente del vademécum SENASA, defina dosis, frecuencia y duración.
   - Si corresponde, aplique una dosis de vacuna vinculada al protocolo oficial ingresando el número de lote; el sistema calculará automáticamente la fecha de la próxima cita de refuerzo.
   - Finalice la atención para persistir la consulta e imprimir la receta o carnet en PDF.
4. **Uso del Copiloto IA:**
   - Abra el drawer lateral haciendo clic en el icono del robot.
   - Utilice los chips de sugerencia rápida o escriba consultas como: *"¿Qué pacientes tienen vacunas vencidas este mes?"*, *"Buscá si hay turnos libres mañana a la tarde"* o *"¿Cuál es la dosis de Amoxicilina para un canino de 15 kg?"*. El agente resolverá la consulta consultando las herramientas de la base de datos.

### Guía para el Propietario / Tutor

1. **Acceso al Panel Familiar:**
   - Inicie sesión con su cuenta de tutor para visualizar a todas sus mascotas vinculadas en tarjetas interactivas.
2. **Consulta de Carné de Vacunación:**
   - Seleccione a una mascota y acceda a la pestaña **Vacunas**. Podrá revisar el historial cronológico de vacunas aplicadas, los lotes administrados, el estado de vigencia y la fecha exacta del próximo refuerzo.
   - Haga clic en **"Descargar Carné PDF"** para obtener el documento oficial para viajes o guarderías.
3. **Agendamiento de Turnos:**
   - Presione **"Solicitar Cita"**, elija la clínica de preferencia, el motivo de la consulta (consulta general, vacunación, control) y elija un horario disponible dentro de la agenda de los profesionales.
4. **Asistente Preventivo de IA:**
   - Consulte dudas sobre síntomas no urgentes o cuidados generales (ej: *"Mi perro tiene vómitos desde hace dos horas, ¿qué debo vigilar?"*). El asistente brindará pautas de observación preventivas con advertencia médico-legal, recomendando la consulta presencial de urgencia si detecta señales de alarma.

### Guía para el Administrador

1. **Gestión de Sedes y Clínicas:**
   - Registre nuevas sucursales, direcciones físicas y teléfonos de contacto.
2. **Asignación de Profesionales:**
   - Vincule veterinarios a una o varias clínicas configurando sus horarios de disponibilidad semanal.
3. **Control de Suscripciones:**
   - Verifique el estado del plan SaaS (`independent` o `clinic_pro`) contratado a través de Mercado Pago.

---

## 2.14. Pruebas del Sistema (Matriz de Casos de Prueba)

| ID Prueba | Módulo | Descripción del Escenario | Datos de Entrada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CP-01** | **Autenticación** | Inicio de sesión con credenciales válidas y almacenamiento de token seguro. | Email y contraseña registrados. | Generación de JWT almacenado en HttpOnly Cookie; redirección al Dashboard según rol. | **Aprobado (OK)** |
| **CP-02** | **Seguridad / Matrícula** | Registro de veterinario con matrícula inexistente o inhabilitada (Categoría B/C). | Matrícula inválida o perteneciente a Categoría B (dependencia pública). | Bloqueo del registro clínico con mensaje descriptivo de habilitación denegada. | **Aprobado (OK)** |
| **CP-03** | **Gestión de Citas** | Reserva de turno verificando disponibilidad del profesional en la clínica. | Mascota, clínica, fecha/hora y motivo de cita. | Registro exitoso en tabla `citas` con estado `Pendiente`; validación de superposición horaria. | **Aprobado (OK)** |
| **CP-04** | **Atención Clínica** | Registro de consulta médica con pesaje y prescripción vinculada a SENASA. | Notas clínicas, peso actual (kg), diagnóstico y producto SENASA. | Inserción atómica en `atenciones`, `atenciones_diagnosticos` y `tratamientos`. | **Aprobado (OK)** |
| **CP-05** | **Vacunación SENASA** | Aplicación de dosis vacunal con cálculo automático de fecha de refuerzo. | Protocolo de vacuna, lote, vía de administración y mascota. | Inserción en `vacuna_dosis` y actualización de `vacuna_serie.proximo_refuerzo` sumando el intervalo oficial de días. | **Aprobado (OK)** |
| **CP-06** | **Copiloto IA (Tools)** | Consulta conversacional con ejecución de Function Calling para verificar agenda. | Mensaje: *"¿Qué turnos tengo agendados para mañana?"*. | El modelo invoca `get_my_appointments`, resuelve la fecha relativa, consulta la BD y responde en lenguaje natural. | **Aprobado (OK)** |
| **CP-07** | **Seguridad IA / Cuotas** | Superación intencional de cuota de llamadas a funciones (`MAX_FUNCTION_CALLS`). | Prompt complejo diseñado para forzar más de 4 llamadas en rol Propietario. | El backend interrumpe la recursión al alcanzar el límite (4 calls) y retorna respuesta parcial segura. | **Aprobado (OK)** |
| **CP-08** | **Auditoría de IA** | Verificación de persistencia de eventos de herramientas invocadas. | Ejecución de tool `search_vademecum` desde el chat. | Inserción inmediata en tabla `audit_log` con ID de usuario, rol, nombre de herramienta y argumentos. | **Aprobado (OK)** |
| **CP-09** | **Facturación SaaS** | Procesamiento de suscripción con webhook de Mercado Pago. | Notificación mock de preapproval con status `authorized`. | Actualización de estado en tabla `suscripciones` a `activo` y desbloqueo de funciones Pro. | **Aprobado (OK)** |
| **CP-10** | **Generación de PDF** | Descarga del carnet de vacunación completo de un paciente. | Solicitud `GET /api/atenciones/:id/pdf` con JWT válido. | Servidor genera y retorna un documento PDF binario válido con formato oficial y datos clínicos. | **Aprobado (OK)** |

---

## 2.15. Conclusiones y Trabajo Futuro

### Aprendizajes Consolidados
El diseño y desarrollo integral de **VetVault** permitió articular competencias de ingeniería de software avanzada en un entorno de alta fidelidad clínica:
1. **Dominio de Arquitectura en Monorrepitorio:** Estructuración eficaz de paquetes compartidos (`@vetvault/shared`) consumidos sincrónicamente por un frontend en React 19 y un backend en Fastify 5, manteniendo coherencia estricta de contratos de interfaz.
2. **Integración Ética y Segura de IA (Agentic Workflows):** Superación del modelo clásico de chatbot estático mediante la implementación de llamadas a funciones seguras (*Tool Calling*), protegiendo la integridad de la base de datos con rate limiting, cuotas por rol y auditoría inmutable.
3. **Persistencia Relacional y Cumplimiento Normativo:** Diseño de un modelo de datos robusto en PostgreSQL 16 con Drizzle ORM que incorpora normativas nacionales reales (catálogo farmacológico SENASA y validación de colegiación profesional).

### Dificultades Técnicas Superadas
- **Aislamiento y Mitigación de Vulnerabilidades en IA:** La prevención de inyecciones de prompt y bucles de recursión infinita en las herramientas exigió calibrar un middleware de rate limiting en memoria y un dispatcher de herramientas con control de presupuesto por rol (`MAX_FUNCTION_CALLS`).
- **Seguridad en Cookies Transfronterizas:** La gestión de autenticación con `HttpOnly Cookies` entre distintos orígenes en desarrollo requirió una cuidadosa configuración de credenciales CORS (`credentials: 'include'`).
- **Normalización de Catálogos Masivos:** La ingesta y limpieza de los datos públicos de SENASA y del padrón veterinario provincial demandó scripts de migración específicos para mapear cientos de registros a esquemas relacionales consistentes.

### Trabajo Futuro y Líneas de Evolución
* **Lanzamiento de la Aplicación Móvil Nativa (`apps/mobile-app`):** Concreción del cliente en React Native para tutores, incorporando notificaciones push nativas para alertas de refuerzo vacunal.
* **Módulo de Telemedicina Sincrónica:** Integración de videoconsultas en vivo con WebRTC para seguimiento postoperatorio y triaje a distancia.
* **Integración con Laboratorios de Diagnóstico:** Admisión y vinculación automática de resultados de análisis clínicos en formatos interoperables (DICOM / PDF).

---

## 2.16. Anexos

### Estructura del Repositorio de Código Fuente

El proyecto se encuentra centralizado en un único monorrepitorio público de GitHub:
* **Repositorio Oficial:** [https://github.com/ftrubiolo/proyecto-vet-pp](https://github.com/ftrubiolo/proyecto-vet-pp)

```
proyecto-vet-pp/
├── apps/
│   ├── web-app/                     # Frontend React 19 + Vite 8
│   │   ├── src/
│   │   │   ├── api/client.ts        # Cliente Fetch con credenciales
│   │   │   ├── components/layout/   # AIChatDrawer, Sidebar, Navbar
│   │   │   └── index.css            # Sistema de Tokens y Glassmorphism
│   │   └── package.json
│   └── mobile-app/                  # React Native (próxima fase)
├── packages/
│   └── shared/                      # Tipos TS, enums y DTOs comunes
│       ├── src/index.ts
│       └── package.json
├── services/
│   └── api-backend/                 # Backend REST Fastify 5
│       ├── src/
│       │   ├── controllers/         # Controladores HTTP
│       │   ├── db/
│       │   │   ├── schema.ts        # Esquema Drizzle ORM
│       │   │   ├── seed.ts          # Semillero inicial
│       │   │   └── import-*.ts      # Ingesta SENASA y Vets Córdoba
│       │   ├── routes/              # Declaración de rutas Fastify
│       │   ├── services/
│       │   │   ├── ai/              # Copiloto IA (Gemini, tools, prompts)
│       │   │   └── *.service.ts     # Lógica de negocio clínica
│       │   └── server.ts            # Punto de entrada de la API
│       └── package.json
├── docker-compose.yml               # Orquestación de PostgreSQL, MinIO, API y Web
├── README.md                        # Guía de presentación del proyecto
└── APP_CONTEXT.md                   # Resumen de contexto y reglas de negocio
```

### Referencias Normativas e Institucionales
1. **Colegio de Médicos Veterinarios de la Provincia de Córdoba:** Ley Provincial N° 5589 y padrón oficial de matriculados activos para ejercicio clínico.
2. **Servicio Nacional de Sanidad y Calidad Agroalimentaria (SENASA):** Registro Nacional de Productos Terapéuticos y Biológicos Veterinarios y Resoluciones vigentes sobre trazabilidad de antimicrobianos y biológicos.
3. **Instituto Superior Villa del Rosario:** Marco pedagógico de la carrera Técnico Superior en Desarrollo Web y Software — Proyecto Final Integrador (PIN) 2026.
