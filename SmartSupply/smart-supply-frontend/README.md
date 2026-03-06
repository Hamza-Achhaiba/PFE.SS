# Smart Supply Frontend

This project implements the frontend requested for the Smart Supply application, utilizing Vite, React, TypeScript, Tanstack Query, and a custom "Soft UI" / Neumorphic styling system written over Bootstrap 5 structure.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   The `.env` file should be located at the root of the project with:
   ```env
   VITE_API_URL=http://localhost:8089
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

## Architecture

- `src/api` - Houses typed Axios instances and API endpoint files matched to the Spring Boot REST definitions. Interceptors manage JWT authentication natively.
- `src/app` - Setup React Query, React Router, and top-level Providers.
- `src/components/ui` - Contains the heavily styled "Soft UI" primitives (Cards, Badges, Buttons, Inputs, Tables) as standalone reusable React functional components.
- `src/features/*` - Domain separation of pages logic (`auth`, `client`, `supplier`), segregating Route Components correctly.
- `src/styles/soft-ui` - Clean layout design variables establishing glassmorphisms, layered shadow aesthetics, and gradient primitives.

## Role & Routing System

Routing is managed via `react-router-dom` using the `<AuthGuard />` wrapper protecting route trees.
1. When navigating to `/login`, React Hook Form captures credentials and submits to `/api/auth/authenticate`.
2. The endpoint responds with `{ token }`, which gets stored inside localStorage as `ss_token`.
3. `jwt-decode` is invoked to read the `role` from the JWT payload. The app navigates the user either to `/client/dashboard` or `/supplier/dashboard`.
4. Stale/unauthorized API requests (401 code) will trigger the Axios error interceptor, erasing tokens and seamlessly booting the user back to the login screen.
