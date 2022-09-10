/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import {defineField, defineType, Schema} from '../types'
import FieldBase = Schema.FieldBase

describe('string types', () => {
  describe('defineType', () => {
    it('should define string schema', () => {
      const stringDef = defineType({
        type: 'string',
        name: 'custom-string',
        title: 'Custom string',
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

      const assignableToString: Schema.StringDefinition = stringDef

      // @ts-expect-error string is not assignable to boolean
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

      const assignableToString: Schema.StringDefinition & FieldBase = stringField
      const nameIsNarrowed: 'stringField' = stringField.name

      const assignableToFieldDef: Schema.FieldDefinition = defineField({
        type: 'string',
        name: 'nestedField',
        options: {
          layout: 'dropdown',
        },
      })
    })
  })
})

export {}
