# SIH 2025 - Offline-First Digital Learning (Nabha)

Monorepo with Yarn Workspaces including:
- apps/mobile (React Native Expo)
- apps/web (React + Vite PWA)
- backend (Node.js + Express + PostgreSQL)
- packages/logic (Sync Manager)
- packages/db (shared schemas/types)
- packages/ui (shared components)

## Quick start

Prerequisites: Node 18+, Yarn (Berry or v1), PostgreSQL 14+

```bash
# Install deps
yarn

# Start backend (after setting up DB)
yarn dev:backend

# Start web app
yarn dev:web

# Start mobile (Expo)
yarn dev:mobile
```

See `docs/` for architecture and sync flow diagrams.
