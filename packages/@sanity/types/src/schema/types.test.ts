/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineType, Schema} from './types'

describe('types', () => {
  describe('defineType', () => {
    it('should define string schema', () => {
      const stringDef = defineType({
        type: 'string',
        name: 'custom-string',
        title: 'Custom string',
        options: {
          layout: 'radio',
          direction: 'horizontal',
          list: [
            {
              value: 'A',
              title: 'An entry',
            },
          ],
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assignableToString: Schema.StringDefinition = stringDef

      // @ts-expect-error string is not assignable to boolean
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const notAssignableToBoolean: Schema.BooleanDefinition = stringDef
    })

    it('should fail compilation for string with incorrect options', () => {
      defineType({
        type: 'string',
        name: 'custom-string',
        title: 'Custom string',
        options: {
          // @ts-expect-error unsassignable is not assiagnable to layout
          layout: 'unsassignable',
          // @ts-expect-error unsassignable is not assiagnable to direction
          direction: 'unsassignable',
          list: [
            {
              // @ts-expect-error object-literals may only assign known fields
              unknownField: 'A',
              title: 'An entry',
            },
          ],
          allowUnknownOptions: true,
        },
      })
    })

    it('should use string type-alias schema', () => {
      const customStringType = defineType({
        type: 'custom-string',
        // API concession for typescript:
        // when alias discriminator is provided, the type is inferred from the provided alias
        // this is needed to give good type-completion for intrinsic types
        // workaround will be to allow devs to extend intrisic types using
        // declaration merging and/or generics via factory function
        alias: 'string',
        name: 'redefined-custom-string',
        title: 'Custom string',
        options: {
          layout: 'radio',
          // @ts-expect-error with alias, we still have options typesafety
          direction: 'illegal',
          list: [
            {
              value: 'A',
              title: 'An entry',
            },
            {
              // @ts-expect-error with alias, we still have options typesafety
              illegal: 'value',
            },
          ],
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assignableToAlias: Schema.TypeAliasDefinition<'custom-string', 'string'> =
        customStringType

      // @ts-expect-error 'custom-string' is not assignable to 'string'
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const notAssignableToString: StringDefinition = customStringType
    })

    it('should use generic alias type def when alias field is missing for non-intrinsic type', () => {
      const customStringType = defineType({
        type: 'custom-string',
        name: 'redefined-custom-string',
        title: 'Custom string',
        options: {
          layout: 'anything-goes-here',
          direction: 'all fields are unknown in the default alias type',
          list: [
            {
              // without alias discriminator on the provided type, we dont have options type-safety
              alsoInNestedFields: 1,
              anythingGoes: true,
            },
          ],
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assignableToAlias: Schema.TypeAliasDefinition<'custom-string', Schema.Type> =
        customStringType

      // @ts-expect-error 'custom-string' is not assignable to 'string'
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const notAssignableToString: StringDefinition = customStringType
    })

    it('should ignore alias for intrinsic types', () => {
      const stringDef = defineType({
        type: 'string',
        alias: 'boolean', // this should possibly give a compilation error, for now it is simply ignored
        name: 'custom-string',
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const assignableToString: Schema.StringDefinition = stringDef

      // @ts-expect-error string is not assignable to boolean
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const notAssignableToBoolean: BooleanDefinition = stringDef
    })
  })

  it('should define array schema', () => {
    const arrayDef = defineType({
      type: 'array',
      name: 'custom-array',
      of: [
        {
          type: 'string',
          options: {
            // FIXME  this is not typesafe atm
            layout: 'wrong-value',
          },
        },
        {type: 'custom-string'},
        //@ts-expect-error missing type
        {},
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const assignableToArray: Schema.ArrayDefinition = arrayDef

    // @ts-expect-error array is not assignable to boolean
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const notAssignableToBoolean: BooleanDefinition = arrayDef
  })

  it('should define reference schema', () => {
    const refDef = defineType({
      type: 'reference',
      name: 'custom-ref',
      to: [
        {
          type: 'string',
          options: {
            // FIXME this is not typesafe atm
            layout: 'wrong-value',
          },
        },
        {type: 'custom-string'},
        //@ts-expect-error missing type
        {},
      ],
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const assignableToRef: Schema.ReferenceDefinition = refDef

    // @ts-expect-error array is not assignable to boolean
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const notAssignableToBoolean: Schema.BooleanDefinition = refDef
  })
})

export {}
