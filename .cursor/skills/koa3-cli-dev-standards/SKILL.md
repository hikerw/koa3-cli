---
name: koa3-cli-dev-standards
description: Project development standards for the koa3-cli repository (Koa backend + Vue3/Vite/Element Plus frontend). Use when editing files, adding features, refactoring, styling, or changing API behaviors to follow this repo’s conventions (messages, dark mode, SCSS, components, git hygiene).
---

# koa3-cli Development Standards

Apply these standards for any change in this repository.

## Stack & structure

- **Backend**: Koa (Node.js), routes under `app/router.js`, controllers under `app/controller/`, services under `app/service/`, models under `app/model/`.
- **Frontend**: Vue 3 + Vite + Element Plus under `client/`.
- **Uploads**: public assets served under `public/uploads/...` (materials currently under `public/uploads/materials`).

## API response + message policy (IMPORTANT)

- **Frontend must not hardcode server-error messages**.
  - API failures should display **backend `message`**.
  - Prefer `ElMessage.error(err.message)` and ensure request layer maps `response.data.message` into `Error.message`.
- **Frontend may keep local validation prompts** (e.g. required field hints), but **server error/success** should follow backend messages when available.

## Dark mode policy (IMPORTANT)

- Dark mode is activated via **`html.dark`**.
- When adding dark styles, use selectors compatible with scoped SFC styles:
  - Prefer `html.dark .your-class { ... }` (works inside scoped SFCs).
  - Avoid relying on non-standard `::global(...)` syntax; if global scoping is needed, use Vue SFC’s `:global(...)` syntax.

## Styling & SCSS

- Component styles should live **inside the component** (`<style lang="scss" scoped>`), not in parent pages.
- If SCSS is introduced, ensure preprocessor dependency exists:
  - In `client/`, dev dependency **`sass-embedded`** is required for Vite SCSS.
- Prefer BEM-ish class naming already present (`mat-card__...`, `group-item__...`).

## UI interaction conventions (materials page patterns)

When touching materials UI (or similar grid pages):

- **Card interactions**:
  - Single click: preview
  - Double click: open full edit
  - Hover: show action controls (overlay/slide-up) without layout jump
- **Action row**:
  - Keep actions compact and non-wrapping.
  - Ensure hover overlays remain readable in dark mode (background and text contrast).

## Code organization (frontend)

- Keep page files slim: move UI blocks into `client/src/views/**/components/**` and pass props/emits.
- Prefer “dumb” components:
  - Components handle rendering + events.
  - Page handles state + API calls.

## Code organization (backend)

- Controllers should validate/parse input and delegate to services.
- Services should contain business logic and DB interactions.
- Models may include non-persistent schema metadata like `comment` fields for documentation.

## Git hygiene

- Do **not** commit:
  - `node_modules/` (root or `client/node_modules/`)
  - logs under `logs/`
  - uploaded real files under `public/uploads/**` (keep `.gitkeep` only)
- Keep `.gitignore` aligned with the above.

## Windows / PowerShell notes

- Use PowerShell-friendly commands (avoid `cd /d`); use `Set-Location` when needed.

## Change safety checklist

Before finishing a change:

- Ensure dark mode styles still apply (check `html.dark` selectors).
- Ensure error toasts show backend `message` (no `'加载失败'`/`'提交失败'` fallbacks for server errors).
- Run lints/diagnostics for edited files when applicable.

