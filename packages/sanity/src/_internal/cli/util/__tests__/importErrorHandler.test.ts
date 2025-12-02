import Module from 'node:module'

import {describe, expect, test} from 'vitest'

import {setupImportErrorHandler} from '../importErrorHandler'

interface ModuleConstructor {
  _load(request: string, parent: Module | undefined, isMain: boolean): any
}

describe('setupImportErrorHandler', () => {
  test('should handle themer.sanity.build URL imports', () => {
    const handler = setupImportErrorHandler()

    const ModuleConstructor = Module as unknown as ModuleConstructor

    // Try to load a themer.sanity.build URL (which would normally fail)
    const result = ModuleConstructor._load(
      'https://themer.sanity.build/api/hues?default=0078ff',
      undefined,
      false,
    )

    expect(result).toBeDefined()
    expect(result.__esModule).toBe(true)
    expect(result.default).toBeDefined()
    expect(result.someProperty.deepProperty).toBeDefined()

    handler.cleanup()
  })

  test('should re-throw errors for non-themer URLs', () => {
    const handler = setupImportErrorHandler()

    const ModuleConstructor = Module as unknown as ModuleConstructor

    expect(() => {
      ModuleConstructor._load(
        'https://example.com/this-module-definitely-does-not-exist-xyz',
        undefined,
        false,
      )
    }).toThrow()

    handler.cleanup()
  })

  test('should restore original Module._load after cleanup', () => {
    const ModuleConstructor = Module as unknown as ModuleConstructor
    const originalLoad = ModuleConstructor._load

    const handler = setupImportErrorHandler()

    expect(ModuleConstructor._load).not.toBe(originalLoad)
    handler.cleanup()
    expect(ModuleConstructor._load).toBe(originalLoad)
  })
})
