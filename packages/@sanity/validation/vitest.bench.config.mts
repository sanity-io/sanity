import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    name: '@sanity/validation benchmarks',
    environment: 'node',
    reporters: ['verbose'],
    benchmark: {include: ['../../../perf/bench/validation.bench.ts']},
    // Keep the measured code in native ESM; fixture imports use Vite's resolver.
    server: {deps: {external: [/\/packages\/@sanity\/(validation|schema)\/lib\//]}},
  },
})
