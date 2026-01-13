# Fractured Universe

## Overview

Fractured Universe is a browser-based space strategy game where players choose a faction, conquer planets, build fleets, and compete for high scores. The game features a client-side game loop with real-time resource management, fleet combat, and AI opponents. High scores are persisted to a PostgreSQL database via a REST API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React hooks with TanStack Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom sci-fi theme (dark mode, neon accents)
- **Fonts**: Oxanium (display) and Space Grotesk (body) for sci-fi aesthetic

### Game Engine
- Client-side game loop managed via `useGameEngine` custom hook
- Real-time tick-based resource generation and AI decision-making
- Faction system with unique bonuses (Tarren, Korai, Reapers, Ascendancy)
- Fleet management with multiple ship categories (drone, frigate, cruiser, battleship, capitol)
- Planet colonization and structure upgrades
- Combat system for fleet-vs-fleet and fleet-vs-planet battles

### Resource System
Four resources:
- **Credits**: Primary currency used for everything (ships, buildings, research) - scales with population
- **Metal**: Used to build ships and bases/structures
- **HE3** (Helium-3): Fuel for fleet movement and research
- **Food**: Maintains and grows population (1 food per 10 population required)

### Planet Types & Modifiers
Each planet type has percentage modifiers for Metal, HE3, Population (max), and Food production:
- **Balanced**: -25% metal, -50% HE3, +75% pop, +50% food
- **Desert**: +25% metal, -50% HE3, -100% pop, -100% food
- **Water**: +25% metal, -100% HE3, -100% pop, +25% food
- **Ice**: -25% metal, +50% HE3, -100% pop, -100% food
- **Forest**: +25% metal, -50% HE3, +50% pop, +100% food
- **Barren**: +75% metal, -25% HE3, +50% pop, -100% food
- **Gas**: -100% metal, +100% HE3, -100% pop, -100% food

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: REST endpoints defined in shared route configuration
- **Build Tool**: Vite for frontend, esbuild for server bundling

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` with Zod validation via drizzle-zod
- **Database**: PostgreSQL (connection via DATABASE_URL environment variable)

### API Structure
Routes are defined declaratively in `shared/routes.ts`:
- `GET /api/scores` - Retrieve top 10 high scores
- `POST /api/scores` - Submit a new high score (validated with Zod)

### Development vs Production
- Development: Vite dev server with HMR, served through Express middleware
- Production: Static files built to `dist/public`, served via Express static middleware

## External Dependencies

### Database
- PostgreSQL database required (provision via Replit or set DATABASE_URL)
- Schema migrations managed via `drizzle-kit push`

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `zod`: Runtime schema validation
- `express`: HTTP server framework
- `connect-pg-simple`: PostgreSQL session storage (available but not currently used)

### Build & Dev Tools
- Vite with React plugin for frontend bundling
- esbuild for server compilation
- TypeScript for type checking across the monorepo