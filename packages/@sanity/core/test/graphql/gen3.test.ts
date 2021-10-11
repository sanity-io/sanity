import {orderBy} from 'lodash'

import extractFromSanitySchema from '../../src/actions/graphql/extractFromSanitySchema'
import generateSchema from '../../src/actions/graphql/gen3'

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
      nonNullDocumentFields: [],
    })

    const schema = generateSchema(extracted)
    expect(sortGraphQLSchema(schema)).toMatchSnapshot()
  })
})

function sortGraphQLSchema(schema) {
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
