import {orderBy} from 'lodash'

import {extractFromSanitySchema} from '../../../src/_internal/cli/actions/graphql/extractFromSanitySchema'
import generateSchema from '../../../src/_internal/cli/actions/graphql/gen3'

import testStudioSchema from './fixtures/test-studio'

describe('GraphQL - Generation 3', () => {
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
  it('Should be able to generate graphql schema', () => {
    const extracted = extractFromSanitySchema(testStudioSchema, {
      nonNullDocumentFields: false,
    })

    const schema = generateSchema(extracted)

    expect(schema.generation).toBe('gen3')
    expect(sortGraphQLSchema(schema)).toMatchSnapshot()
  })

  it('Should be able to generate graphql schema with filterType prefix', () => {
    const extracted = extractFromSanitySchema(testStudioSchema, {
      nonNullDocumentFields: false,
    })

    const suffix = 'CustomFilterSuffix'

    const schema = generateSchema(extracted, {filterSuffix: suffix})

    expect(schema.types.filter((type) => type.name.endsWith(suffix))).not.toHaveLength(0)
    expect(sortGraphQLSchema(schema)).toMatchSnapshot()
  })
})

function sortGraphQLSchema(schema: any) {
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
    fields: orderBy(type.fields, (field) => field.fieldName),
  }))

  return {interfaces, queries, types, generation: schema.generation}
}
