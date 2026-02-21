# AGENTS.md — Countdown

## Project overview

A self-contained vanilla HTML5 countdown timer. **No build step, no package
manager, no dependencies.** The entire application lives in a single file named
`code` (an HTML file without extension) at the repository root.

- Language: HTML5 + CSS3 + ES6+ JavaScript (no TypeScript, no frameworks)
- Target event: `22/04/2026 10:00` local device time (Spanish civil-service exam)
- Interface language: **Spanish** — all user-visible text, comments, and labels
  must be written in Spanish.

---

## Running / developing

There is no build step. Open `index.html` directly in any modern browser:

```
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

To work on it, edit the relevant file in any editor and reload the browser tab
(`Ctrl+R` / `Cmd+R`).

---

## Build, lint, and test commands

| Command | Status |
|---------|--------|
| Build   | None — no compilation required |
| Lint    | None — no ESLint / Stylelint configured |
| Test    | None — no testing framework configured |
| Format  | None — no Prettier configured |

Because there are no automated checks, verify changes manually by opening
`code` in a browser and confirming the countdown displays and ticks correctly.

If tooling is ever added, update this section immediately.

---

## File structure

```
countdown/
├── index.html    ← Estructura HTML y enlaces a CSS/JS
├── style.css     ← Todos los estilos
├── script.js     ← Lógica del contador
├── AGENTS.md     ← Este archivo
└── README.md     ← Descripción del proyecto
```

Do not merge the files back into a single file unless the user explicitly
requests it.

---

## HTML conventions

- Use lowercase `<!doctype html>`.
- Set `lang="es"` on `<html>` (content is Spanish).
- `<meta charset="utf-8" />` and `<meta name="viewport" ...>` must be the
  first two tags in `<head>`.
- Self-close void elements with ` />` (e.g. `<meta ... />`, `<link ... />`).
- Maintain ARIA attributes for accessibility:
  - Wrap the display group in `role="group"` with an `aria-label`.
  - Mark decorative/redundant elements with `aria-hidden="true"`.

---

## CSS conventions

- Define all theme colors as **CSS custom properties** on `:root`. Never
  hard-code color values directly in rules — reference `var(--name)` instead.
- Omit spaces between property name and value when writing compact single-line
  rules (e.g. `margin:0;`), but use indented multi-line blocks for rules with
  multiple properties.
- Use `min()` / `clamp()` / `calc()` for responsive sizing instead of
  hard-coded pixel values that break at different viewports.
- Breakpoint: `@media (max-width:520px)` for mobile overrides.
- CSS class names: **lowercase kebab-case** (`.card`, `.title`, `.digits`,
  `.units`).
- Element `id` values: **camelCase** (`id="display"`, `id="name"`).
- Vendor-prefixed properties follow their unprefixed counterpart:
  ```css
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  ```
- Avoid `!important`.

---

## JavaScript conventions

### Variables and constants

- Use `const` by default; use `let` only when the variable must be reassigned.
  Never use `var`.
- **SCREAMING_SNAKE_CASE** for module-level constants that represent fixed
  configuration values (e.g. `const TARGET = new Date(...)`).
- **camelCase** for all other variables, parameters, and utility functions
  (e.g. `totalSeconds`, `pad2`).

### Functions

- Prefer **arrow functions** for short utilities:
  ```js
  const pad2 = n => String(n).padStart(2, "0");
  ```
- Use **named `function` declarations** for the main logic functions that are
  called by `setInterval` or event listeners (e.g. `function tick() { ... }`).
  This makes stack traces easier to read.

### Strings

- Use **double quotes** `"..."` for string literals.
- Use **template literals** `` `...` `` for string interpolation instead of
  concatenation.

### DOM

- Access elements by `id` via `document.getElementById("id")`.
- Update text content via `.textContent = ...` (not `.innerHTML`) unless HTML
  markup is genuinely required.

### Time / intervals

- `setInterval(tick, 1000)` drives the countdown — call `tick()` once before
  the interval so the display is populated immediately on load.
- Clamp elapsed time: `if (diff < 0) diff = 0;` — never display negative
  values.
- Use `Math.floor` for all time-unit decomposition.

### Error handling

No `try/catch` is needed in this project. Handle edge cases inline (e.g. the
`diff < 0` clamp above). Keep logic simple and side-effect-free.

### Comments

- Write all code comments in **Spanish**.
- Use inline comments to explain non-obvious choices (e.g. why month index is
  `3` for April, why `requestAnimationFrame` is present).

---

## Changing the target date or label

Two lines control the countdown target:

```js
// script.js, línea ~3
const TARGET = new Date(2026, 3, 22, 10, 0, 0); // (mes 3 = abril)
```

```html
<!-- index.html, línea ~16 -->
<div class="title" id="name">Días para el examen Aux. Admin.</div>
```

Update both when the event changes.

---

## Generación de SVG

Para cualquier tarea que implique crear o modificar archivos `.svg`, delega
siempre al subagente `@svg` en lugar de hacerlo directamente. Ese agente usa
`github-copilot/gemini-3.1-pro-preview`, optimizado para gráficos vectoriales.

---

## Git

- Commit messages may be in Spanish or English; be concise and descriptive.
- There is no CI pipeline. Verify the page renders correctly in a browser
  before committing.
