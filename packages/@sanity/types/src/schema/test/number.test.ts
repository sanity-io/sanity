/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Some of these tests have no expect statement;
 * use of ts-expect-error serves the same purpose - TypeScript is the testrunner here
 */
import type {NumberDefinition, StringDefinition} from '../definition'
import {defineField, defineType} from '../types'

describe('number types', () => {
  describe('defineType', () => {
    it('should define number schema', () => {
      const numberDef = defineType({
        type: 'number',
        name: 'custom-number',
        title: 'Custom',
        placeholder: 'badbf',
        icon: () => null,
        description: 'Description',
        initialValue: 10,
        validation: (Rule) => [
          Rule.required()
            .required()
            .min(1)
            .max(2)
            .lessThan(5)
            .greaterThan(10)
            .integer()
            .precision(3)
            .positive()
            .negative()
            .custom((value) => (value?.toFixed(1) === '2.0' ? 'Error' : true))
            .warning(),
          // @ts-expect-error something does not exist on numberRule
          Rule.something(5).error(),
        ],
        hidden: () => false,
        options: {
          layout: 'radio',
          list: [2, 4],
          direction: 'vertical',
        },
      })

      const assignableToNumber: NumberDefinition = numberDef

      // @ts-expect-error number is not assignable to string
      const notAssignableToString: StringDefinition = numberDef
    })
  })

  it('should support Rule.valueOfField calls inside defineField', () => {
    const numberField: NumberDefinition = defineField({
      type: 'number',
      name: 'defineField-defined',
      description: 'field defined with defineField, containing validation using Rule.valueOfField',
      validation: (Rule) => {
        const fieldRef = Rule.valueOfField('some-other-field')
        return Rule.min(fieldRef)
          .max(fieldRef)
          .lessThan(fieldRef)
          .greaterThan(fieldRef)
          .precision(fieldRef)
      },
    })
  })
})

export {}
