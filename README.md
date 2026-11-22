# E-commerce Frontend

A responsive storefront and admin panel built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui. The frontend uses Axios and TanStack Query for the Express API, Better Auth for sessions, and Zustand for the persistent cart.

## Local setup

1. Install Bun and use pnpm `12.10.1`, the version declared in [package.json](package.json).
2. Start the sibling Express backend. For the default local setup, run it on port `5000` and set its `FRONTEND_URL` to `http://localhost:3000` so CORS and Better Auth accept requests from the frontend.
3. From the frontend directory, install dependencies and copy [.env.example](.env.example) to `.env.local`.

   ```bash
   pnpm install --frozen-lockfile
   cp .env.example .env.local
   ```

   In PowerShell, use `Copy-Item .env.example .env.local` for the copy step.

4. Run `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Local value | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api/v1` | Base URL for the storefront and admin API |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | `http://localhost:5000/api/auth` | Base URL for Better Auth |

Use the deployed URLs when building for production. These variables are exposed to the browser. Database, Better Auth, and Cloudinary secrets belong in the backend environment. Image uploads require Cloudinary configuration in the backend.

## Features and routes

| Area | Routes | Features |
| --- | --- | --- |
| Storefront | `/`, `/products`, `/products/[slug]`, `/category/[slug]`, `/page/[slug]` | Dynamic navigation and homepage, product search and filters, galleries, variants, reviews, and custom pages |
| Shopping | `/cart`, `/checkout`, `/track-order` | Persistent cart, guest and signed-in checkout, delivery zones, coupons, configurable payment fields, and order tracking |
| Customer account | `/login`, `/register`, `/account`, `/account/orders` | Authentication, profile updates, and order history |
| Admin | `/admin` and subroutes | Dashboard, catalog, content builders, site settings, payments, shipping zones, coupons, orders, and user management |

Account routes require a session. Admin routes require the `ADMIN` or `SUPER_ADMIN` role. Role changes require `SUPER_ADMIN`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Build for production and run TypeScript checks |
| `pnpm start` | Serve the production build |

## Project structure

| Path | Contents |
| --- | --- |
| `app/(store)/` | Storefront, checkout, tracking, and account routes |
| `app/(auth)/` | Login and registration |
| `app/(admin)/admin/` | Admin dashboard and management pages |
| `app/services/` and `app/types/` | API integrations and TypeScript models |
| `app/store/useCartStore.ts` | Persistent Zustand cart |
| `components/` | Storefront, admin, shared, and shadcn/ui components |
| `lib/` and `proxy.ts` | Axios, Better Auth, utilities, and route protection |
