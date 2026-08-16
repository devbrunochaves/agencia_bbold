import { defineConfig } from "vitest/config";
import path from "path";

// Pure-function tests only (domain/rules-level logic) — no Next.js runtime,
// no Supabase, no React rendering. See §60-65 of the Fase 8 brief: this is
// scoped narrowly to the aggregation/rules functions that are genuinely
// worth guarding with a regression test, not JSX/UI.
export default defineConfig({
  test: {
    environment: "node",
    include: ["modules/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
