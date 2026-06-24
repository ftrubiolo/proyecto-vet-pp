---
name: VetVault Design Tokens
version: 1.0.0
colors:
  primary: "#0ea5e9"
  secondary: "#22c55e"
  bg: "#f8f9fa"
  bgDark: "#0f1119"
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
    fontSize: "32px"
    fontWeight: "600"
    letterSpacing: "-0.5px"
  h2:
    fontFamily: "Manrope, sans-serif"
    fontSize: "24px"
    fontWeight: "600"
    letterSpacing: "-0.24px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    lineHeight: "1.45em"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
rounded:
  outer: "24px"
  inner: "12px"
  pill: "20px"
  md: "12px"
  sm: "8px"
  xs: "4px"
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

Define all root variables within your global theme file (`src/index.css`) and component rules.

### A. Global Layout Variables

These variables handle backgrounds, borders, and typography across system light and dark states.

```css
:root {
  /* Fonts */
  --sans: 'Inter', system-ui, -apple-system, sans-serif;
  --heading: 'Manrope', system-ui, -apple-system, sans-serif;

  /* Typography Defaults */
  font: 16px/145% var(--sans);
  letter-spacing: 0.18px;

  /* --- LIGHT THEME --- */
  --bg: #f8f9fa;               /* Application canvas background */
  --surface: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(241, 245, 249, 0.3) 100%), var(--surface-solid); /* Base card container background, sidebars, headers */
  --surface-solid: #FFFFFF;
  --surface-2: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(241, 245, 249, 0.3) 100%); /* Pure glass overlay gradient */
  --border: #e5e4e7;           /* Fine borders, rules, and input elements */
  --text: #334155;             /* Body text */
  --text-h: #0f172a;           /* Headings and high-emphasis text */
  --text-muted: #94a3b8;

  /* Accents */
  --accent-blue: #0EA5E9;
  --accent-green: #22C55E;
  --accent-gradient: linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-green) 100%);
  --shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 20px 40px -10px rgba(0, 0, 0, 0.12);

  /* Radii */
  --radius-outer: 24px;
  --radius-inner: 12px;
  --radius-pill: 20px;
  --radius-md: 12px;
  --radius-sm: 8px;
  --radius-xs: 4px;

  /* Spacing */
  --space-xxs: 4px;
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Layout Dimensions */
  --sidebar-width: 260px;
  --header-height: 68px;

  /* Transitions */
  --transition: 0.2s ease;
  --transition-slow: 0.3s ease;

  /* State Colors */
  --success: #22C55E;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #0EA5E9;
}

[data-theme="dark"] {
  /* --- DARK THEME --- */
  --bg: #0f1119;               /* Canvas background */
  --surface: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(8, 0, 255, 0.02) 100%), var(--surface-solid); /* Elevated dark surface containers */
  --surface-solid: #12151d;
  --surface-2: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%); /* Pure glass overlay gradient */
  --border: #2e303a;         /* High-contrast border color */
  --text: #9ca3af;           /* High-readability body text */
  --text-h: #f3f4f6;         /* Emphasized heading text */
  --text-muted: #6b7280;
  --shadow: rgba(0, 0, 0, 0.4) 0px 10px 15px -3px, rgba(0, 0, 0, 0.25) 0px 4px 6px -2px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
}
```

### B. Compact Mode Overrides

Compact mode is triggered via the `[data-compact="true"]` attribute, reducing padding, gaps, and dimensions for higher-density layouts:

```css
[data-compact="true"] {
  --space-xxs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --radius-outer: 16px;
  --radius-inner: 8px;
  --sidebar-width: 220px;
  --header-height: 52px;
}
```

### C. Dynamic Context Accents

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
h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading);
  font-weight: 600;
  color: var(--text-h);
  line-height: 1.2;
}

h1 {
  font-size: 2rem; /* 32px */
  letter-spacing: -0.5px;
}

h2 {
  font-size: 1.5rem; /* 24px */
  letter-spacing: -0.24px;
}

h3 {
  font-size: 1.125rem; /* 18px */
}

p {
  font-family: var(--sans);
  color: var(--text);
  line-height: 1.6;
}
```

---

## 4. Glassmorphism & Elevation System

When creating card layouts or nested interactive blocks inside containers (e.g., list items, vaccine records, timelines), apply glassmorphic rules to give them physical depth.

### A. Base Card (`.card`)
Used for main page segments, sidebars, and modals.
- **Background**: `var(--surface)` (Linear gradient overlaying the solid color surface).
- **Blur**: `backdrop-filter: blur(12px)`.
- **Border**: `1px solid var(--border)`.

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-outer);
  padding: var(--space-lg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-sm);
}
```

### B. Nested Glass Card (`.card-inner`)
Used for list items or elements nested inside main card containers.
- **Background**: `var(--surface-2)`.
- **Blur**: `backdrop-filter: blur(8px)`.
- **Border**: `1px solid var(--border)`.

```css
.card-inner {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-inner);
  padding: var(--space-md);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: border-color var(--transition), box-shadow var(--transition), background-color var(--transition);
}

.card-inner:hover {
  border-color: var(--accent, var(--accent-blue));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
}
```

---

## 5. UI Elements & Layout Guidelines

### A. Rounded Corners (Border Radiuses)
To maintain a high-end, premium dashboard layout, follow these radius values:
- **Base Cards / Sidebar / Modals**: `24px` (`--radius-outer`).
- **Inner Cards / Buttons / Textfields**: `12px` (`--radius-inner` or `--radius-md`).
- **Pills / Badges**: `20px` (`--radius-pill`).
- **Small Badges / Micro elements**: `8px` (`--radius-sm`) or `4px` (`--radius-xs`).

### B. Buttons (Transitions and Hover Effects)
All actions must feature micro-animations to encourage interaction:

```css
/* Base button style class */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-inner);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--sans);
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), background-color var(--transition), color var(--transition), border-color var(--transition);
  white-space: nowrap;
  line-height: 1.4;
}

/* Primary accent call-to-action */
.btn-primary {
  background: var(--accent-gradient-role, var(--accent-gradient));
  color: #fff;
  box-shadow: 0 4px 12px var(--accent-light, rgba(14, 165, 233, 0.15));
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--accent-light, rgba(14, 165, 233, 0.25));
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

/* Secondary outline action */
.btn-secondary {
  background: var(--surface-solid);
  color: var(--text-h);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border);
}

/* Danger action */
.btn-danger {
  background: #fef2f2;
  color: var(--danger);
  border: 1px solid #fecaca;
}

.btn-danger:hover:not(:disabled) {
  background: #fee2e2;
}

/* Ghost action */
.btn-ghost {
  background: transparent;
  color: var(--text);
  border: none;
  padding: 8px 12px;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--accent-light, rgba(14, 165, 233, 0.08));
  color: var(--accent, var(--accent-blue));
}
```

---

## 6. Language & Localization (Visible Text)

To maintain a consistent and accessible experience for VetVault's target audience, all visible user-facing text must adhere to these guidelines:

- **User Interface Language**: All user-facing text—including titles, navigation menus, button labels, form placeholders, alerts, modals, and helper tooltips—must be written in **Spanish** (Español).
- **Codebase and Design Token Naming**: All developer-facing code (e.g., CSS class names, custom variables, function names, properties, database schemas, and comments) should be written in **English** to follow standard developer conventions and ensure scalability.
