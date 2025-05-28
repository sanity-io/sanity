import {orderBy} from 'lodash'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {extractFromSanitySchema} from '../../../src/_internal/cli/actions/graphql/extractFromSanitySchema'
import generateSchema from '../../../src/_internal/cli/actions/graphql/gen3'
import manySelfRefsSchema from './fixtures/many-self-refs'
import testStudioSchema from './fixtures/test-studio'
import unionRefsSchema from './fixtures/union-refs'

describe('GraphQL - Generation 3', () => {
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

  describe.each([
    {name: 'testStudioSchema', sanitySchema: testStudioSchema},
    {name: 'manySelfRefsSchema', sanitySchema: manySelfRefsSchema},
    {name: 'unionRefsSchema', sanitySchema: unionRefsSchema},
  ])(`Union cache: sanitySchema: $name`, ({sanitySchema}) => {
    /**
     * @jest-environment jsdom
     */
    it.each([true, false])(
      'Should be able to generate graphql schema, withUnionCache: %p',
      (withUnionCache) => {
        const extracted = extractFromSanitySchema(sanitySchema, {
          nonNullDocumentFields: false,
          withUnionCache,
        })

        const schema = generateSchema(extracted)

        expect(schema.generation).toBe('gen3')
        expect(sortGraphQLSchema(schema)).toMatchSnapshot()
      },
    )

    it('Should generate the same schema with and without union cache', () => {
      const extractedWithoutUnionCache = extractFromSanitySchema(sanitySchema, {
        nonNullDocumentFields: false,
        withUnionCache: false,
      })

      const extractedWithUnionCache = extractFromSanitySchema(sanitySchema, {
        nonNullDocumentFields: false,
        withUnionCache: true,
      })

      expect(extractedWithoutUnionCache).toEqual(extractedWithUnionCache)

      const schemaWithoutUnionCache = generateSchema(extractedWithoutUnionCache)
      const schemaWithUnionCache = generateSchema(extractedWithUnionCache)
      expect(sortGraphQLSchema(schemaWithoutUnionCache)).toEqual(
        sortGraphQLSchema(schemaWithUnionCache),
      )
    })
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
