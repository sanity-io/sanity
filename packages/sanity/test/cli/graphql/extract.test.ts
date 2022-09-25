import {orderBy} from 'lodash'
import {extractFromSanitySchema} from '../../../src/_internal/cli/actions/graphql/extractFromSanitySchema'
import type {ApiSpecification} from '../../../src/_internal/cli/actions/graphql/types'
import testStudioSchema from './fixtures/test-studio'

describe('GraphQL - Schema extraction', () => {
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
  it('Should be able to extract schema', () => {
    const extracted = extractFromSanitySchema(testStudioSchema, {
      nonNullDocumentFields: false,
    })

    expect(sortExtracted(extracted)).toMatchSnapshot()
  })
})

function sortExtracted(schema: ApiSpecification) {
  const interfaces = orderBy(schema.interfaces, (iface) => iface.name).map((iface) => ({
    ...iface,
    fields: orderBy(iface.fields, (field) => field.fieldName),
  }))

  const types = orderBy(schema.types, (type) => type.name).map((type) => ({
    ...type,
    fields: orderBy((type as any).fields, (field) => field.fieldName),
  }))

  return {interfaces, types}
}
