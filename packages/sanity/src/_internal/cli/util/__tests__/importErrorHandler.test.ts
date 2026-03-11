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

  test('should retry .js relative imports as .ts on MODULE_NOT_FOUND', () => {
    const handler = setupImportErrorHandler()
    const ModuleConstructor = Module as unknown as ModuleConstructor

    // Patch originalLoad to simulate .js not found but .ts succeeds
    const realLoad = ModuleConstructor._load
    const originalUnderlyingLoad = (Module as unknown as ModuleConstructor)._load

    // We need to intercept at a lower level: replace the handler's underlying original
    // Instead, we'll just test via a known .ts file that exists
    handler.cleanup()

    // Set up a fresh handler with a controlled originalLoad
    const calls: string[] = []
    const fakeOriginalLoad = ModuleConstructor._load
    ModuleConstructor._load = function (
      request: string,
      parent: Module | undefined,
      isMain: boolean,
    ) {
      calls.push(request)
      if (request === './schemas/index.js') {
        const err = new Error(`Cannot find module './schemas/index.js'`) as Error & {code: string}
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      if (request === './schemas/index.ts') {
        return {schema: 'mock'}
      }
      return fakeOriginalLoad.call(this, request, parent, isMain)
    }

    // Now set up the import error handler on top of our fake
    const handler2 = setupImportErrorHandler()

    const result = ModuleConstructor._load('./schemas/index.js', undefined, false)
    expect(result).toEqual({schema: 'mock'})
    expect(calls).toContain('./schemas/index.js')
    expect(calls).toContain('./schemas/index.ts')

    handler2.cleanup()
    // Restore the real load
    ModuleConstructor._load = fakeOriginalLoad
  })

  test('should retry .jsx relative imports as .tsx on MODULE_NOT_FOUND', () => {
    const ModuleConstructor = Module as unknown as ModuleConstructor
    const fakeOriginalLoad = ModuleConstructor._load

    const calls: string[] = []
    ModuleConstructor._load = function (
      request: string,
      parent: Module | undefined,
      isMain: boolean,
    ) {
      calls.push(request)
      if (request === './Component.jsx') {
        const err = new Error(`Cannot find module './Component.jsx'`) as Error & {code: string}
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      if (request === './Component.tsx') {
        return {Component: 'mock'}
      }
      return fakeOriginalLoad.call(this, request, parent, isMain)
    }

    const handler = setupImportErrorHandler()

    const result = ModuleConstructor._load('./Component.jsx', undefined, false)
    expect(result).toEqual({Component: 'mock'})

    handler.cleanup()
    ModuleConstructor._load = fakeOriginalLoad
  })

  test('should retry .mjs relative imports as .mts on MODULE_NOT_FOUND', () => {
    const ModuleConstructor = Module as unknown as ModuleConstructor
    const fakeOriginalLoad = ModuleConstructor._load

    const calls: string[] = []
    ModuleConstructor._load = function (
      request: string,
      parent: Module | undefined,
      isMain: boolean,
    ) {
      calls.push(request)
      if (request === './utils/helper.mjs') {
        const err = new Error(`Cannot find module './utils/helper.mjs'`) as Error & {code: string}
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      if (request === './utils/helper.mts') {
        return {helper: 'mock'}
      }
      return fakeOriginalLoad.call(this, request, parent, isMain)
    }

    const handler = setupImportErrorHandler()

    const result = ModuleConstructor._load('./utils/helper.mjs', undefined, false)
    expect(result).toEqual({helper: 'mock'})

    handler.cleanup()
    ModuleConstructor._load = fakeOriginalLoad
  })

  test('should NOT retry bare module specifiers with .ts', () => {
    const ModuleConstructor = Module as unknown as ModuleConstructor
    const fakeOriginalLoad = ModuleConstructor._load

    const calls: string[] = []
    ModuleConstructor._load = function (
      request: string,
      parent: Module | undefined,
      isMain: boolean,
    ) {
      calls.push(request)
      if (request === 'some-package/index.js') {
        const err = new Error(`Cannot find module 'some-package/index.js'`) as Error & {
          code: string
        }
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      if (request === 'some-package/index.ts') {
        return {bad: 'should not reach'}
      }
      return fakeOriginalLoad.call(this, request, parent, isMain)
    }

    const handler = setupImportErrorHandler()

    expect(() => {
      ModuleConstructor._load('some-package/index.js', undefined, false)
    }).toThrow('Cannot find module')

    // Should NOT have tried the .ts variant
    expect(calls).not.toContain('some-package/index.ts')

    handler.cleanup()
    ModuleConstructor._load = fakeOriginalLoad
  })

  test('should throw original error if both .js and .ts fail', () => {
    const ModuleConstructor = Module as unknown as ModuleConstructor
    const fakeOriginalLoad = ModuleConstructor._load

    const originalError = new Error(`Cannot find module './missing.js'`) as Error & {code: string}
    originalError.code = 'MODULE_NOT_FOUND'

    ModuleConstructor._load = function (
      request: string,
      parent: Module | undefined,
      isMain: boolean,
    ) {
      if (request === './missing.js') {
        throw originalError
      }
      if (request === './missing.ts') {
        const err = new Error(`Cannot find module './missing.ts'`) as Error & {code: string}
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      return fakeOriginalLoad.call(this, request, parent, isMain)
    }

    const handler = setupImportErrorHandler()

    expect(() => {
      ModuleConstructor._load('./missing.js', undefined, false)
    }).toThrow(originalError)

    handler.cleanup()
    ModuleConstructor._load = fakeOriginalLoad
  })

  test('should NOT retry if MODULE_NOT_FOUND is from a transitive dependency', () => {
    const ModuleConstructor = Module as unknown as ModuleConstructor
    const fakeOriginalLoad = ModuleConstructor._load

    const calls: string[] = []
    ModuleConstructor._load = function (
      request: string,
      parent: Module | undefined,
      isMain: boolean,
    ) {
      calls.push(request)
      if (request === './existing.js') {
        // The error message references a different module (transitive dep)
        const err = new Error(`Cannot find module 'some-dep'`) as Error & {code: string}
        err.code = 'MODULE_NOT_FOUND'
        throw err
      }
      if (request === './existing.ts') {
        return {bad: 'should not reach'}
      }
      return fakeOriginalLoad.call(this, request, parent, isMain)
    }

    const handler = setupImportErrorHandler()

    expect(() => {
      ModuleConstructor._load('./existing.js', undefined, false)
    }).toThrow('Cannot find module')

    // Should NOT have tried the .ts variant since the error was about a different module
    expect(calls).not.toContain('./existing.ts')

    handler.cleanup()
    ModuleConstructor._load = fakeOriginalLoad
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
