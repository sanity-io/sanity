import type * as perfHelpers from './tests/helpers/index.ts'

declare global {
  interface Window {
    perf: typeof perfHelpers
  }
}
