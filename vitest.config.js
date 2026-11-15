import { defineConfig } from 'vitest/config'

// Tests run in plain Node. The database tests load supabase/schema.sql into an
// in-memory Postgres (PGlite), so they need no Supabase project and no network.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
    testTimeout: 30000,
    hookTimeout: 120000,
  },
})
