// Imported by relative path rather than the `@repo/test-config/vitest`
// specifier because test-studio does not depend on that package (and we must
// not add dependencies). The helper wires the `@sanity/*` / `sanity` source
// aliases these tests resolve against.
import {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import {defineConfig} from '../../packages/@repo/test-config/vitest/index.mjs'

const rootDir = dirname(fileURLToPath(import.meta.url))

// Minimal, self-contained vitest config for test-studio unit tests. The root
// vitest.config.mts intentionally does not register dev/test-studio as a
// project, so these tests are run explicitly:
//
//   pnpm vitest run --config dev/test-studio/vitest.config.mts
//
// Scoped to the standalone table POC's pure helpers for now; widen `include`
// if more test-studio units appear.
export default defineConfig({
  root: rootDir,
  test: {
    include: ['./schema/**/*.test.ts'],
    exclude: ['./dist/**', './node_modules/**', './.sanity/**'],
  },
})
