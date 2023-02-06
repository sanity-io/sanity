import * as perfHelpers from './helpers'

declare global {
  interface Window {
    perf: typeof perfHelpers
  }
}
