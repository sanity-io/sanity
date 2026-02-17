import {describe, expect, it} from 'vitest'

import {getDevServerConfig} from '../devAction'

const createOutput = () => {
  const spinnerInstance = {
    start: () => spinnerInstance,
    succeed: () => spinnerInstance,
    fail: () => spinnerInstance,
  }
  return {
    spinner: () => spinnerInstance,
    print: () => {},
    warn: () => {},
  } as any
}

describe('getDevServerConfig', () => {
  it('passes schemaExtraction config from cliConfig to dev server options', () => {
    const schemaExtraction = {
      enabled: true as const,
      path: '/custom/schema.json',
      workspace: 'my-workspace',
      enforceRequiredFields: true,
      watchPatterns: ['lib/**/*.ts'],
    }

    const config = getDevServerConfig({
      flags: {},
      workDir: '/project',
      cliConfig: {
        schemaExtraction,
      },
      output: createOutput(),
    })

    expect(config.schemaExtraction).toEqual(schemaExtraction)
  })

  it('returns undefined schemaExtraction when not configured', () => {
    const config = getDevServerConfig({
      flags: {},
      workDir: '/project',
      cliConfig: {},
      output: createOutput(),
    })

    expect(config.schemaExtraction).toBeUndefined()
  })

  it('returns undefined schemaExtraction when cliConfig is undefined', () => {
    const config = getDevServerConfig({
      flags: {},
      workDir: '/project',
      cliConfig: undefined,
      output: createOutput(),
    })

    expect(config.schemaExtraction).toBeUndefined()
  })
})
