---
name: Koa3 CLI workspace instructions
description: "Project-specific guidance for working on the Koa3 CLI / sample app repository. Includes run commands, architecture overview, and code conventions."
---

# Workspace Instructions

## When to use this file

Use this guidance for any task in this repository, especially when the request touches:
- backend server code under `app/`
- configuration files under `config/`
- public assets under `public/`
- frontend admin client under `client/`
- package scripts, dependencies, or project setup

If the user asks for project architecture, code style, or where to make a change, prefer this file over generic Node/Koa guidance.

## Run and development commands

Root project commands:
- `npm install` — install backend dependencies
- `npm run dev` — run `nodemon app.js` for live reloading
- `npm start` — run `node app.js`

Frontend client commands:
- `cd client && npm install`
- `cd client && npm run dev`
- `cd client && npm run build`
- `cd client && npm run preview`

Notes:
- The repo uses `volta` pinning for Node `25.2.1` in `package.json`.
- The root `test` script is a placeholder and currently exits with an error.

## Project structure and architecture

This repo contains two main areas:

1. Backend server (root-level app)
   - `app.js` — application entry point
   - `app/router.js` — route registration
   - `app/controller/` — controller handlers
   - `app/service/` — business logic layer
   - `app/model/` — database schemas and models
   - `app/middleware/` — Koa middleware
   - `app/lib/` — reusable utilities (logger, validator, file/helper logic)
   - `config/` — environment-specific configuration
   - `public/` — static assets and frontend entry page

2. Frontend admin client (`client/`)
   - `client/src/` — Vue 3 + Vite application source
   - `client/src/api/` — HTTP API wrappers for backend endpoints
   - `client/src/views/` — page components
   - `client/src/router.js` — client-side routing
   - `client/package.json` — frontend scripts and dependencies

## Backend conventions

- Use the MVC-like separation: controller handles request/response, service handles business rules, model handles data.
- Use `Joi` validation via `app/lib/validator.js`.
- Validated input is stored in `ctx.state.validated`:
  - `ctx.state.validated.body`
  - `ctx.state.validated.query`
  - `ctx.state.validated.params`
- Validation failures return `422` and include the first error message.
- Use middleware in `app/middleware/` for cross-cutting concerns: auth, error handling, request logging, rate limiting.
- Environment config is loaded from `config.default.js`, `config.local.js`, or `config.prod.js` based on `NODE_ENV`.
- `.env.example` defines the supported environment variables.

## Frontend conventions

- The frontend is a Vue 3 + Vite application under `client/`.
- API client logic belongs in `client/src/api/`.
- UI routes live in `client/src/router.js` and `client/src/views/`.
- Use composables and config modules under `client/src/composables/` and `client/src/config/`.
- Frontend styles are in `client/src/styles/`.

## What to preserve

- Existing backend routing and middleware structure.
- The current environment-based config loading approach.
- The use of `ctx.state.validated` for sanitized request data.
- The root `package.json` scripts and `volta` node version marker.

## What to avoid

- Adding a new test framework unless explicitly requested, since the repository currently has no test suite.
- Changing the CLI packaging semantics unless the user asks about `bin/cli.js` or the CLI tool itself.
- Assuming this is only a frontend repo; it is primarily a Node/Koa backend with an optional Vue admin client.

## Relevant docs and sources

- `README.md` — project overview and usage instructions
- `package.json` — root scripts, dependencies, and Node toolchain
- `client/package.json` — frontend build and dev commands
- `config/` — runtime environment config logic
- `app/lib/validator.js` — validation helper and convention for request data

## Example prompts

- `Help me add a new Koa route to handle POST /api/auth/login.`
- `Refactor the validation logic in app/lib/validator.js to support nested objects.`
- `Update the client API wrapper in client/src/api/auth.js to handle token refresh.`
- `Explain how this repo loads configuration for production versus development.`
