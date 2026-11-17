import {defineConfig} from '@repo/test-config/vitest'

export default defineConfig({
  test: {
    // Registers the get-it mock matchers (toHaveReceivedRequest, ...) on
    // vitest's expect. The side-effect import lives in a setup file rather
    // than the test files that use the matchers: TypeScript 7 (tsc and oxlint
    // typeCheck) currently mis-scopes `declare module 'vitest'` augmentations
    // shipped in node_modules for the file that directly imports them, while
    // every other file in the program sees the augmented types correctly
    // (TypeScript 6 handles both). See test/setup.ts.
    setupFiles: ['./test/setup.ts'],
  },
})
