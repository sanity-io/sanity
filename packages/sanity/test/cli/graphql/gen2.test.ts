import {orderBy} from 'lodash-es'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {extractFromSanitySchema} from '../../../src/_internal/cli/actions/graphql/extractFromSanitySchema'
import generateSchema from '../../../src/_internal/cli/actions/graphql/gen2'
import testStudioSchema from './fixtures/test-studio'

describe('GraphQL - Generation 2', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.runAllTimers()
  })

  /**
   * @jest-environment jsdom
   */
  it('Should be able to generate graphql schema', () => {
    const extracted = extractFromSanitySchema(testStudioSchema, {
      nonNullDocumentFields: false,
    })

    const schema = generateSchema(extracted)

    expect(schema.generation).toBe('gen2')
    expect(sortGraphQLSchema(schema)).toMatchSnapshot()
  })
})

function sortGraphQLSchema(schema: any) {
  const interfaces = orderBy(schema.interfaces, (iface) => iface.name).map((iface) =>
    Object.assign({}, iface, {
      fields: orderBy(iface.fields, (field) => field.fieldName),
    }),
  )
  const queries = orderBy(schema.queries, (query) => query.fieldName).map((query) =>
    Object.assign({}, query, {
      args: orderBy(query.args, (arg) => arg.name),
    }),
  )

  const types = orderBy(schema.types, (type) => type.name).map((type) =>
    Object.assign({}, type, {
      fields: orderBy(type.fields, (field) => field.fieldName),
    }),
  )

  return {interfaces, queries, types, generation: schema.generation}
}
