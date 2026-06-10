// @vitest-environment node
import {describe, expect, it} from 'vitest'

import {defineConfig} from '../src/core/config/defineConfig'
import {prepareConfig} from '../src/core/config/prepareConfig'

// Runs it the Node environment to catch issues with accessing browser-only globals
// during e.g. Next.js server rendering, CLI scripts, scheduled jobs, etc.
describe('prepareConfig (Node environment)', () => {
  it('runs without `window` or `localStorage` defined', () => {
    expect(typeof window).toBe('undefined')
    expect(typeof localStorage).toBe('undefined')
  })

  it('does not throw when called from Node', () => {
    const config = defineConfig({
      name: 'default',
      projectId: 'node-test',
      dataset: 'node',
      schema: {types: []},
    })

    expect(() => prepareConfig(config)).not.toThrow()
  })
})
