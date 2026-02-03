import {type SanityClient} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {extractClientConfig} from '../extractClientConfig'

describe('extractClientConfig', () => {
  /**
   * Helper to create a mock SanityClient with configurable options
   */
  function createMockClient(configOverrides: Record<string, unknown> = {}): SanityClient {
    const defaultConfig = {
      projectId: 'test-project',
      dataset: 'production',
      apiVersion: '2024-01-01',
      useCdn: true,
      token: 'secret-token',
      ...configOverrides,
    }

    return {
      config: vi.fn(() => defaultConfig),
    } as unknown as SanityClient
  }

  describe('basic extraction', () => {
    it('should extract basic client configuration', () => {
      const client = createMockClient()

      const result = extractClientConfig(client)

      expect(result).toMatchObject({
        projectId: 'test-project',
        dataset: 'production',
        apiVersion: '2024-01-01',
        useCdn: true,
      })
    })

    it('should call client.config() to get configuration', () => {
      const client = createMockClient()

      extractClientConfig(client)

      expect(client.config).toHaveBeenCalled()
    })
  })

  describe('serializable output', () => {
    it('should strip non-serializable properties like functions', () => {
      const client = createMockClient({
        someFunction: () => 'should be stripped',
        nestedObj: {
          anotherFn: () => 'also stripped',
          validProp: 'kept',
        },
      })

      const result = extractClientConfig(client)

      expect(result).not.toHaveProperty('someFunction')
      expect((result as any).nestedObj).not.toHaveProperty('anotherFn')
      expect((result as any).nestedObj.validProp).toBe('kept')
    })

    it('should preserve primitive values', () => {
      const client = createMockClient({
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
      })

      const result = extractClientConfig(client)

      expect(result).toMatchObject({
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
      })
    })

    it('should preserve arrays and nested objects', () => {
      const client = createMockClient({
        arrayValue: [1, 2, 3],
        nestedObject: {
          deep: {
            value: 'test',
          },
        },
      })

      const result = extractClientConfig(client)

      expect(result).toMatchObject({
        arrayValue: [1, 2, 3],
        nestedObject: {
          deep: {
            value: 'test',
          },
        },
      })
    })
  })

  describe('worker environment flags', () => {
    it('should set useProjectHostname to true', () => {
      const client = createMockClient({useProjectHostname: false})

      const result = extractClientConfig(client)

      expect(result.useProjectHostname).toBe(true)
    })

    it('should set ignoreBrowserTokenWarning to true', () => {
      const client = createMockClient({ignoreBrowserTokenWarning: false})

      const result = extractClientConfig(client)

      expect(result.ignoreBrowserTokenWarning).toBe(true)
    })

    it('should override existing useProjectHostname value', () => {
      const client = createMockClient({useProjectHostname: false})

      const result = extractClientConfig(client)

      // Should be overridden to true for worker environment
      expect(result.useProjectHostname).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty config', () => {
      const client = {
        config: vi.fn(() => ({})),
      } as unknown as SanityClient

      const result = extractClientConfig(client)

      expect(result).toMatchObject({
        useProjectHostname: true,
        ignoreBrowserTokenWarning: true,
      })
    })

    it('should handle undefined values in config', () => {
      const client = createMockClient({
        token: undefined,
        withCredentials: undefined,
      })

      const result = extractClientConfig(client)

      // undefined values should be stripped by JSON.parse/stringify
      expect('token' in result && result.token === undefined).toBe(false)
    })

    it('should preserve token if present', () => {
      const client = createMockClient({
        token: 'my-secret-token',
      })

      const result = extractClientConfig(client)

      expect(result.token).toBe('my-secret-token')
    })
  })
})
