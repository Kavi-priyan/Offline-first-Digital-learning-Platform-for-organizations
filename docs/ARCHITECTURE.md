## Architecture Overview

- apps/mobile: React Native (Expo), SQLite for offline storage, QR import/export
- apps/web: React (Vite PWA), IndexedDB via Dexie, Service Worker for offline
- backend: Node.js + Express + PostgreSQL
- packages/logic: Sync Manager shared across apps
- packages/db: Schemas/types and data mappers
- packages/ui: Shared UI primitives (web + RN via cross-platform or web-only)

Data Flow:
1. Content and progress are stored locally (SQLite/IndexedDB)
2. Sync Manager queues mutations while offline
3. When online, Sync Manager pushes queued updates to `/sync`
4. Backend merges using LWW (lessons) and merge (quiz scores)
5. Teacher dashboard fetches reports from backend
