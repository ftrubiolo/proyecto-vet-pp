---
name: VetVault Design Tokens
version: 1.0.0
colors:
  primary: "#0ea5e9"
  secondary: "#22c55e"
  bg: "#f8f9fa"
  bgDark: "#121212"
  border: "#e5e4e7"
  borderDark: "#2e303a"
  text: "#334155"
  textDark: "#9ca3af"
  heading: "#0f172a"
  headingDark: "#f3f4f6"
  accentBlue: "#0ea5e9"
  accentGreen: "#22c55e"
typography:
  h1:
    fontFamily: "Manrope, sans-serif"
    fontSize: "56px"
    fontWeight: "500"
    letterSpacing: "-1.68px"
  h2:
    fontFamily: "Manrope, sans-serif"
    fontSize: "24px"
    fontWeight: "500"
    lineHeight: "1.18em"
    letterSpacing: "-0.24px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "18px"
    lineHeight: "1.45em"
spacing:
  base: "32px"
  sm: "16px"
  xs: "12px"
  xxs: "8px"
  xxxs: "4px"
rounded:
  outer: "24px"
  inner: "12px"
  pill: "20px"
---

# VetVault Web Application — Design System & Theme Specification

This document defines the architecture, color tokens, typography scales, layout rules, and component specifications of the **VetVault** web application. Use this guide to maintain visual consistency across all pages and elements.

## 1. Theme Engine & Architecture

VetVault implements a semantic, dynamic design system that combines role-based branding with system-wide light/dark themes. This system is driven entirely by native CSS custom properties.

### Dynamic Role Contexts
The interface automatically adopts a custom accent color depending on the context or active role:
- `.role-vet`: Tailored for Veterinarians, using a high-contrast blue theme.
- `.role-owner`: Tailored for Pet Owners, using a friendly, nature-inspired green theme.

These accent variables are defined relative to global variables and change fluidly without rewriting component rules.

---

## 2. Design Tokens (CSS Variables)

Define all root variables within your global theme file (`src/index.css`) and role-specific files (`src/App.css`).

### A. Global Layout Variables

These variables handle backgrounds, borders, and typography across system light and dark states.

```css
:root {
  /* Fonts */
  --sans: 'Inter', sans-serif;
  --heading: 'Manrope', sans-serif;

  /* Typography Defaults */
  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;

  /* --- LIGHT THEME --- */
  --bg: #f8f9fa;               /* Application canvas background */
  --surface: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(241, 245, 249, 0.3) 100%), #FFFFFF; /* Base card container background, sidebars, headers */
  --surface-2: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(241, 245, 249, 0.3) 100%); /* Pure glass overlay gradient */
  --border: #e5e4e7;           /* Fine borders, rules, and input elements */
  --text: #334155;             /* Body text */
  --text-h: #0f172a;           /* Headings and high-emphasis text */

  /* Accents */
  --accent-blue: #0EA5E9;
  --accent-green: #22C55E;
  --accent-gradient: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-green) 100%);
  --shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* --- DARK THEME --- */
    --bg: #121212;             /* Canvas background */
    --surface: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), #18181B; /* Elevated dark surface containers */
    --surface-2: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%); /* Pure glass overlay gradient */
    --border: #2e303a;         /* High-contrast border color */
    --text: #9ca3af;           /* High-readability body text */
    --text-h: #f3f4f6;         /* Emphasized heading text */
  }
}
```

### B. Dynamic Context Accents

Wrap page roots with these classes to activate role-based coloring:

```css
/* Veterinarian Focus */
.role-vet {
  --accent: var(--accent-blue);
  --accent-rgb: 14, 165, 233;
  --accent-hover: #0284c7;
  --accent-light: rgba(14, 165, 233, 0.1);
  --accent-gradient-role: linear-gradient(135deg, #0EA5E9 0%, #3b82f6 100%);
}

/* Pet Owner Focus */
.role-owner {
  --accent: var(--accent-green);
  --accent-rgb: 34, 197, 94;
  --accent-hover: #16a34a;
  --accent-light: rgba(34, 197, 94, 0.1);
  --accent-gradient-role: linear-gradient(135deg, #22C55E 0%, #10b981 100%);
}
```

---

## 3. Typography Rules

Maintain strict typographic hierarchy to guarantee premium aesthetics and high readability.

- **Primary / Body Font**: `Inter` (Sans-Serif) for modern, clean body structures, lists, and numbers.
- **Headings Font**: `Manrope` (Sans-Serif) for strong, highly-legible title layouts.

```css
h1 {
  font-family: var(--heading);
  font-weight: 500;
  font-size: 56px;
  letter-spacing: -1.68px;
  color: var(--text-h);
}

h2 {
  font-family: var(--heading);
  font-weight: 500;
  font-size: 24px;
  line-height: 118%;
  letter-spacing: -0.24px;
  color: var(--text-h);
}

p {
  font-family: var(--sans);
  font-size: 18px;
  line-height: 145%;
  color: var(--text);
}
```

---

## 4. Glassmorphism & Elevation System

When creating nested interactive blocks inside base card containers (e.g., list items, vaccine records, timelines), apply glassmorphic rules to give them physical depth.

### Specification: Glass Nested Card (Inside Cards/Panels)
- **Background**: `var(--surface-2)` (Semi-transparent linear gradient).
- **Blur**: `backdrop-filter: blur(8px)` (and `-webkit-backdrop-filter` for Safari engine support) to blur elements behind the container.
- **Border**: `1px solid var(--border)`.
- **Transitions**: Smooth transitions (`0.2s ease`) on background color, border color, and shadow.

```css
.list-item,
.timeline-content,
.vaccine-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.list-item:hover,
.timeline-content:hover,
.vaccine-card:hover {
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}
```

---

## 5. UI Elements & Layout Guidelines

### A. Rounded Corners (Border Radiuses)
To maintain a high-end, premium dashboard layout, follow these radius values:
- **Base Cards / Sidebar / Modals**: `24px` or `20px` (e.g., `.panel-card`, `.modal-content`, `.sidebar`).
- **Inner Cards / Buttons / Textfields**: `14px` or `12px` (e.g., `.list-item`, `.btn-primary`, `.form-input`).
- **Pills / Badges**: `20px` (e.g., `.badge`, `.sim-toggle-pill`).

### B. Buttons (Transitions and Hover Effects)
All actions must feature micro-animations to encourage interaction:

```css
/* primary accent call-to-action */
.btn-primary {
  border-radius: 12px;
  background: var(--accent-gradient-role, var(--accent-gradient));
  box-shadow: 0 4px 12px var(--accent-light);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px var(--accent-light);
}

/* Secondary outline action */
.btn-secondary {
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.btn-secondary:hover {
  background: var(--border);
  color: var(--text-h);
}
```

### C. Sidebar Navigation Rules
The side navigation bar relies on absolute height mapping and custom visual triggers:
- Highlight active states with `background: var(--accent-light)` and `color: var(--accent)`.
- Apply hover transitions with `transform: translateX(4px)` to give menu selections a sense of physical weight and response.

---

## 6. Language & Localization (Visible Text)

To maintain a consistent and accessible experience for VetVault's target audience, all visible user-facing text must adhere to these guidelines:

- **User Interface Language**: All user-facing text—including titles, navigation menus, button labels, form placeholders, alerts, modals, and helper tooltips—must be written in **Spanish** (Español).
- **Codebase and Design Token Naming**: All developer-facing code (e.g., CSS class names, custom variables, function names, properties, database schemas, and comments) should be written in **English** to follow standard developer conventions and ensure scalability.
