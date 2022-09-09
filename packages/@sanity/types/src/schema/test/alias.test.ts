/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from '../types'

describe('alias type test', () => {
  it('should support narrowing alias types', () => {
    // there is no way for us to know the type uf a custom-user-type by default
    const notStringDef = defineType({
      type: 'custom-string',
      name: 'custom-string-redefined',
      options: {
        // atm this is allowed
        direction: 'horizontal',
        // but so is this
        slugify: () => null,
      },
    })

    //@ts-expect-error options is a union type of everything and not very useful
    const notAssignableToStringOptions: Schema.StringOptions | undefined = notStringDef.options

    const narrowedAlias = defineType(
      {
        type: 'custom-string',
        name: 'custom-string-redefined',
        options: {
          direction: 'horizontal',
          //@ts-expect-error slugify is not in StringOptions
          slugify: () => null,
        },
      },
      {alias: 'string'}
    )

    const assignableToStringOptions: Schema.StringOptions | undefined = narrowedAlias.options
  })

  it('should support aliased array', () => {
    const narrowedAlias: Schema.TypeAliasDefinition<'custom-string-array', 'array'> = defineType(
      {
        type: 'custom-string-array',
        name: 'custom-string-redefined',
        options: {
          sortable: true,
          list: [{title: 'title', value: {_type: 'unknown-so-not-perfect'}}],
        },
      },
      {alias: 'array'}
    )
    const assignableToArrayOptions: Schema.ArrayOptions | undefined = narrowedAlias.options
  })
})

export {}
