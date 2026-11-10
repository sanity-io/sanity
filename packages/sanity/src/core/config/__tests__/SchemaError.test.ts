import {type Schema} from '@sanity/types'
import {describe, expect, test} from 'vitest'

import {SchemaError} from '../SchemaError'

const SCHEMA = {name: 'test'} as Schema

describe('SchemaError', () => {
  test('falls back to a bare message when no context is given', () => {
    expect(new SchemaError(SCHEMA).message).toBe('Schema has validation errors')
  })

  test('names the workspace in the message', () => {
    const error = new SchemaError(SCHEMA, {
      workspaceName: 'staging',
      projectId: 'abc123',
      dataset: 'staging-dataset',
    })

    expect(error.message).toBe('Schema has validation errors in workspace "staging"')
  })

  test('names the source as well when a nested source failed', () => {
    const error = new SchemaError(SCHEMA, {
      workspaceName: 'staging',
      sourceName: 'nested',
      projectId: 'abc123',
      dataset: 'staging-dataset',
    })

    expect(error.message).toBe(
      'Schema has validation errors in source "nested" in workspace "staging"',
    )
  })

  // The project ID and dataset are deliberately absent from the message: it is
  // captured verbatim by error reporting, which does not serialise `context`.
  test('keeps the project and dataset out of the message', () => {
    const error = new SchemaError(SCHEMA, {
      workspaceName: 'staging',
      projectId: 'abc123',
      dataset: 'staging-dataset',
    })

    expect(error.message).not.toContain('abc123')
    expect(error.message).not.toContain('staging-dataset')
  })

  test('exposes the schema and context for the error screen', () => {
    const context = {
      workspaceName: 'staging',
      projectId: 'abc123',
      dataset: 'staging-dataset',
    }

    const error = new SchemaError(SCHEMA, context)

    expect(error.name).toBe('SchemaError')
    expect(error.schema).toBe(SCHEMA)
    expect(error.context).toEqual(context)
  })
})
