import {orderBy} from 'lodash'

import {extractFromSanitySchema} from '../../../src/_internal/cli/actions/typegen/extractFromSanitySchema'
import generateSchema from '../../../src/_internal/cli/actions/typegen/gen3'
import type {GeneratedApiSpecification} from '../../../src/_internal/cli/actions/typegen/types'

import testStudioSchema from '../graphql/fixtures/test-studio'

describe('Generating TypeScript definitions from a Sanity Schema', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.resetModules()
  })

  afterEach(() => {
    jest.runAllTimers()
  })

  /**
   * @jest-environment jsdom
   */
  it('Should be able to generate typescript definitions from schema', () => {
    const extracted = extractFromSanitySchema(testStudioSchema, {
      nonNullDocumentFields: false,
    })

    const schema = generateSchema(extracted)

    expect(schema.generation).toBe('gen3')
    expect(sortGraphQLSchema(schema)).toMatchSnapshot()
  })
})

function sortGraphQLSchema(schema: GeneratedApiSpecification) {
  const interfaces = orderBy(schema.interfaces, (iface) => iface.name).map((iface) => ({
    ...iface,
    fields: orderBy(iface.fields, (field) => field.fieldName),
  }))
  const queries = orderBy(schema.queries, (query) => query.fieldName).map((query) => ({
    ...query,
    args: orderBy(query.args, (arg) => arg.name),
  }))

  const types = orderBy(schema.types, (type) => type.name).map((type) => ({
    ...type,
    // @ts-expect-error -- @TODO handle the typings
    fields: orderBy(type.fields, (field) => field.fieldName),
  }))

  return {interfaces, queries, types, generation: schema.generation}
}
