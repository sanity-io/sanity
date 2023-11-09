/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {
  BooleanDefinition,
  FieldDefinition,
  FieldDefinitionBase,
  StringDefinition,
} from '../definition'
import {defineField, defineType} from '../types'

describe('string types', () => {
  describe('defineType', () => {
    it('should define string schema', () => {
      const stringDef = defineType({
        type: 'string',
        name: 'custom-string',
        title: 'Custom string',
        description: 'Description',
        placeholder: 'fdsasfd',
        initialValue: () => Promise.resolve('string'),
        validation: (Rule) => [
          Rule.required()
            .min(1)
            .max(10)
            .length(10)
            .uppercase()
            .lowercase()
            .regex(/a+/, 'test', {name: 'yeah', invert: true})
            .regex(/a+/, {name: 'yeah', invert: true})
            .regex(/a+/, 'test')
            .regex(/a+/)
            .email()
            .custom((value) => (value?.toUpperCase() == 'SHOUT' ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan is not on StringRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
        options: {
          layout: 'radio',
          direction: 'horizontal',
          list: [{value: 'A', title: 'An entry'}],
        },
      })

      const assignableToString: StringDefinition = stringDef

      // @ts-expect-error string is not assignable to boolean
      const notAssignableToBoolean: BooleanDefinition = stringDef
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
        },
      })
    })

    it('should not have type-helping fields not on string', () => {
      defineType({
        type: 'string',
        name: 'custom-string',
        //@ts-expect-error preview does not exist in type StringDefinition
        preview: {},
        of: [],
      })
    })
  })

  describe('defineField', () => {
    it('should define string field', () => {
      const stringField = defineField({
        type: 'string',
        name: 'stringField',
        title: 'String',
        fieldset: 'test',
        group: 'test',
        description: 'Description',
        initialValue: () => Promise.resolve('string'),
        validation: (Rule) => [
          Rule.required()
            .min(1)
            .max(10)
            .length(10)
            .uppercase()
            .lowercase()
            .regex(/a+/, 'test', {name: 'yeah', invert: true})
            .regex(/a+/, {name: 'yeah', invert: true})
            .regex(/a+/, 'test')
            .regex(/a+/)
            .custom((value) => (value?.toUpperCase() == 'SHOUT' ? 'Error' : true))
            .warning(),
          // @ts-expect-error greaterThan is not on StringRule
          Rule.greaterThan(5).error(),
        ],
        hidden: () => false,
        readOnly: () => false,
        options: {
          layout: 'radio',
          direction: 'horizontal',
          list: [{value: 'A', title: 'An entry'}],
        },
      })

      const assignableToString: StringDefinition & FieldDefinitionBase = stringField
      const nameIsNarrowed: 'stringField' = stringField.name

      const assignableToFieldDef: FieldDefinition = defineField({
        type: 'string',
        name: 'nestedField',
        options: {
          layout: 'dropdown',
        },
      })
    })

    it('should support Rule.valueOfField calls', () => {
      const stringField: StringDefinition = defineField({
        type: 'string',
        name: 'defineField-defined',
        description:
          'field defined with defineField, containing validation using Rule.valueOfField',
        validation: (Rule) => {
          const fieldRef = Rule.valueOfField('some-other-field')
          return Rule.min(fieldRef).max(fieldRef).max(length)
        },
      })
    })
  })
})

export {}
