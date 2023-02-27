import * as perfHelpers from './tests/helpers'

declare global {
  interface Window {
    perf: typeof perfHelpers
  }
}
