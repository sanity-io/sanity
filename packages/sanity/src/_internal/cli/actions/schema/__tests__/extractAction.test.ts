import {describe, expect, it} from 'vitest'
import {SchemaError as CoreSchemaError} from 'sanity'

// Re-implement the helper functions for testing since they're not exported
// These mirror the implementation in extractAction.ts

function isSchemaError(err: unknown): err is Error & {name: 'SchemaError'} {
  if (typeof err !== 'object' || err === null) {
    return false
  }

  const errorLike = err as {name?: unknown; message?: unknown}
  const hasSchemaErrorName = errorLike.name === 'SchemaError'
  const hasSchemaErrorMessage = errorLike.message === 'SchemaError'

  return hasSchemaErrorName || hasSchemaErrorMessage
}

function isValidationProblemGroup(item: unknown): item is {path: unknown[]; problems: unknown[]} {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  const group = item as Record<string, unknown>
  return Array.isArray(group.path) && Array.isArray(group.problems)
}

function extractValidationFromCoreSchemaError(error: unknown): unknown[] | null {
  if (!(error instanceof CoreSchemaError)) {
    return null
  }

  const schema = error.schema as unknown as Record<string, unknown> | null | undefined
  if (!schema || typeof schema !== 'object') {
    return null
  }

  const validation = schema._validation
  if (!Array.isArray(validation)) {
    return null
  }

  if (!validation.every(isValidationProblemGroup)) {
    return null
  }

  return validation
}

describe('extractAction helpers', () => {
  describe('isSchemaError', () => {
    it('returns true for error with name "SchemaError"', () => {
      const error = new Error('Some message')
      error.name = 'SchemaError'
      expect(isSchemaError(error)).toBe(true)
    })

    it('returns true for error with message "SchemaError" (worker thread serialization)', () => {
      // When errors are serialized across worker threads, they may lose their
      // prototype chain and only preserve the error name in the message
      const error = {message: 'SchemaError', name: 'Error'}
      expect(isSchemaError(error)).toBe(true)
    })

    it('returns false for regular Error', () => {
      const error = new Error('Regular error')
      expect(isSchemaError(error)).toBe(false)
    })

    it('returns false for non-object', () => {
      expect(isSchemaError(null)).toBe(false)
      expect(isSchemaError(undefined)).toBe(false)
      expect(isSchemaError('string')).toBe(false)
      expect(isSchemaError(123)).toBe(false)
    })
  })

  describe('isValidationProblemGroup', () => {
    it('returns true for valid problem group', () => {
      const group = {
        path: [{kind: 'type', type: 'document', name: 'test'}],
        problems: [{severity: 'error', message: 'Test error'}],
      }
      expect(isValidationProblemGroup(group)).toBe(true)
    })

    it('returns true for empty arrays', () => {
      const group = {path: [], problems: []}
      expect(isValidationProblemGroup(group)).toBe(true)
    })

    it('returns false if path is not an array', () => {
      const group = {path: 'not-an-array', problems: []}
      expect(isValidationProblemGroup(group)).toBe(false)
    })

    it('returns false if problems is not an array', () => {
      const group = {path: [], problems: 'not-an-array'}
      expect(isValidationProblemGroup(group)).toBe(false)
    })

    it('returns false for null or non-object', () => {
      expect(isValidationProblemGroup(null)).toBe(false)
      expect(isValidationProblemGroup(undefined)).toBe(false)
      expect(isValidationProblemGroup('string')).toBe(false)
    })
  })

  describe('extractValidationFromCoreSchemaError', () => {
    it('returns null for non-CoreSchemaError', () => {
      const regularError = new Error('Regular error')
      expect(extractValidationFromCoreSchemaError(regularError)).toBe(null)
    })

    it('returns null for null/undefined', () => {
      expect(extractValidationFromCoreSchemaError(null)).toBe(null)
      expect(extractValidationFromCoreSchemaError(undefined)).toBe(null)
    })

    it('extracts validation from CoreSchemaError with _validation array', () => {
      const validation = [
        {
          path: [{kind: 'type', type: 'document', name: 'test'}],
          problems: [{severity: 'error', message: 'Missing field name'}],
        },
      ]

      // Create a mock schema object with _validation
      const mockSchema = {_validation: validation}

      // CoreSchemaError requires a schema object with _validation
      const error = new CoreSchemaError(mockSchema as any)

      const result = extractValidationFromCoreSchemaError(error)
      expect(result).toEqual(validation)
    })

    it('returns null if schema has no _validation property', () => {
      const mockSchema = {someOtherProperty: true}
      const error = new CoreSchemaError(mockSchema as any)

      expect(extractValidationFromCoreSchemaError(error)).toBe(null)
    })

    it('returns null if _validation is not an array', () => {
      const mockSchema = {_validation: 'not-an-array'}
      const error = new CoreSchemaError(mockSchema as any)

      expect(extractValidationFromCoreSchemaError(error)).toBe(null)
    })

    it('returns null if _validation contains invalid items', () => {
      const mockSchema = {
        _validation: [
          {path: [], problems: []}, // valid
          {invalidShape: true}, // invalid - missing path and problems
        ],
      }
      const error = new CoreSchemaError(mockSchema as any)

      expect(extractValidationFromCoreSchemaError(error)).toBe(null)
    })
  })
})
