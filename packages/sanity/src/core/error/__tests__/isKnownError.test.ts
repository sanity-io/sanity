import {describe, expect, test} from 'vitest'

import {ConfigResolutionError} from '../../config/ConfigResolutionError'
import {SchemaError} from '../../config/SchemaError'
import {CorsOriginError} from '../../store/_legacy/cors/CorsOriginError'
import {ViteDevServerStoppedError} from '../../studio/ViteDevServerStopped'
import {isKnownError} from '../isKnownError'

describe('#isKnownError', () => {
  test('should return true for SchemaError errors', () => {
    expect(
      isKnownError(
        new SchemaError({
          _registry: {},
          name: 'test',
          get: () => undefined,
          has: () => false,
          getTypeNames: () => [],
        }),
      ),
    ).toBe(true)
  })

  test('should return true for CorsOriginError errors', () => {
    expect(
      isKnownError(
        new CorsOriginError({
          isStaging: false,
          projectId: 'test',
        }),
      ),
    ).toBe(true)
  })

  test('should return true for ConfigResolutionError errors', () => {
    expect(
      isKnownError(
        new ConfigResolutionError({
          name: 'test',
          type: 'test',
          causes: [],
        }),
      ),
    ).toBe(true)
  })

  test('should return true for ViteDevServerStoppedError errors', () => {
    expect(isKnownError(new ViteDevServerStoppedError())).toBe(true)
  })

  test('should return false for unknown errors', () => {
    expect(isKnownError(new Error('unknown'))).toBe(false)
  })

  test('should return false for null', () => {
    // oxlint-disable-next-line no-explicit-any
    expect(isKnownError(null as any)).toBe(false)
  })

  test('should return false for undefined', () => {
    // oxlint-disable-next-line no-explicit-any
    expect(isKnownError(undefined as any)).toBe(false)
  })

  test('should return false for an object that does not have a ViteDevServerStoppedError property', () => {
    // oxlint-disable-next-line no-explicit-any
    expect(isKnownError({} as any)).toBe(false)
  })
})
