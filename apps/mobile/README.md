# NexHub Mobile (placeholder)

This workspace exists to reserve `apps/mobile` in the Turborepo so the monorepo
shape doesn't need to change later. No app is scaffolded yet.

When mobile work begins, the likely path is Expo (React Native) sharing:
- `packages/types` — database & domain types generated from Supabase
- `packages/config` — shared eslint/tailwind/ts config where applicable
- Supabase client/auth patterns from `apps/web`

Not started in Phase One.
